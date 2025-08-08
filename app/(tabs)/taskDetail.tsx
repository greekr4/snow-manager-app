import { useTaskStore } from "@/stores/taskStore";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// KeyboardAwareScrollView를 다시 사용합니다.
import { useAuth } from "@/stores/authStore";
import { usePushStore } from "@/stores/pushStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

// 타입 정의 - DB 스키마에 맞게 수정
interface ProcessItem {
  process_category: string;
  process_type: string;
  process_company: string;
  process_company_tel: string;
  process_status: string;
  process_memo: string;
}

interface TaskDetail {
  delivery_type: string;
  task_desc: string;
  paper_size: string;
  product_size: string;
  paper_type: string;
  process: ProcessItem[];
}

interface JobData {
  TASK_KEY: string;
  ADMIN_KEY: string;
  TASK_TITLE: string;
  TASK_COMPANY: string;
  TASK_PRIORITY: string;
  TASK_PROGRESSING: string;
  TASK_ORDER_DATE: string;
  TASK_DELIVERY_DATE: string;
  TASK_DETAIL: string; // JSON 문자열
  CREATED_AT: string;
  UPDATED_AT: string;
}

// 작업 업데이트를 위한 타입
interface UpdateTaskParams {
  taskKey: string;
  taskDetail: any; // 객체 형태
}

// 댓글 추가를 위한 타입
interface CreateCommentParams {
  taskKey: string;
  adminKey: string;
  commentContent: string;
}

// 로그 추가를 위한 타입
interface CreateLogParams {
  taskKey: string;
  adminKey: string;
  logContent: string;
}

// API 함수들
const fetchTaskDetail = async (taskKey: string) => {
  const response = await axios.get(
    `http://210.114.18.110:3333/tasks/${taskKey}`
  );
  return response.data;
};

const createComment = async (params: CreateCommentParams) => {
  const response = await axios.post(
    `http://210.114.18.110:3333/comments`,
    params
  );
  return response.data;
};

const createLog = async (params: CreateLogParams) => {
  const response = await axios.post(`http://210.114.18.110:3333/logs`, params);
  return response.data;
};

const updateTask = async ({ taskKey, taskDetail }: UpdateTaskParams) => {
  console.log("작업 업데이트 시작:", taskKey, taskDetail);
  const response = await axios.patch(
    `http://210.114.18.110:3333/tasks/${taskKey}`,
    {
      taskDetail: taskDetail, // updateTasksDto 없이 직접 taskDetail 전송
    }
  );
  return response.data;
};

// 작업 전체 상태 업데이트 API
const updateTaskProgressing = async ({
  taskKey,
  progressing,
}: {
  taskKey: string;
  progressing: "대기" | "진행중" | "완료";
}) => {
  return axios.patch(`http://210.114.18.110:3333/tasks/${taskKey}`, {
    taskProgressing: progressing,
  });
};

// DetailItem, DetailFinish, Comment, CommentForm 컴포넌트는 이전과 동일합니다.
// (코드 길이상 생략)

// DetailItem 컴포넌트
interface DetailItemProps {
  label: string;
  value: string;
  minHeight?: number;
}

// DetailFinish
interface DetailFinishProps {
  label: string;
  title: string;
  company: string;
  tel?: string;
  enabled: boolean;
  taskKey: string;
  processIndex: number;
  onStatusChange: (index: number, status: "완료" | "미완료") => void;
  isUpdating: boolean;
}

// Comment
interface CommentProps {
  user: string;
  comment: string;
  dataTime: string;
}

// CommentForm
interface CommentFormProps {
  onSubmit: (comment: string) => void;
  isLoading?: boolean;
}

// WorkHistory
interface WorkHistoryProps {
  dateTime: string;
  action: string;
  user: string;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, minHeight }) => {
  return (
    <View style={styles.detailContainer}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, minHeight ? { minHeight } : {}]}>
        {value}
      </Text>
    </View>
  );
};

const DetailFinish: React.FC<DetailFinishProps> = ({
  label,
  title,
  company,
  tel,
  enabled,
  taskKey,
  processIndex,
  onStatusChange,
  isUpdating,
}) => {
  // enabled prop이 변경될 때마다 로컬 상태 업데이트
  React.useEffect(() => {
    setIsEnabled(enabled);
  }, [enabled]);

  const [isEnabled, setIsEnabled] = useState(enabled);

  const toggleSwitch = () => {
    const newStatus = isEnabled ? "미완료" : "완료";

    // 업데이트 중이면 무시
    if (isUpdating) return;

    console.log(
      `DetailFinish 토글: ${label} (${processIndex}) - ${isEnabled} -> ${newStatus}`
    );

    // 즉시 로컬 상태 업데이트 (낙관적 업데이트)
    setIsEnabled(!isEnabled);

    // 콜백 함수 호출하여 업데이트된 TASK_DETAIL을 받아서 API 호출
    onStatusChange(processIndex, newStatus);
  };

  const handleCall = async () => {
    try {
      const phoneNumber = tel;
      const url = `tel:${phoneNumber}`;
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("오류", "전화 앱을 열 수 없습니다.");
      }
    } catch (error) {
      Alert.alert("오류", "전화 연결에 실패했습니다.");
    }
  };

  return (
    <View style={styles.detailContainer}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.finishContainer}>
        <View style={styles.finishBox}>
          <Text style={styles.finishTitle}>{title}</Text>
          <Text style={styles.finishCompany}>{company}</Text>
          {tel && (
            <TouchableOpacity style={styles.phoneButton} onPress={handleCall}>
              <Ionicons name="call" size={12} color="#007AFF" />
              <Text style={styles.phoneText}>{tel}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View
          style={[
            styles.finishBox,
            { alignItems: "center", justifyContent: "center" },
          ]}
        >
          <Switch
            onValueChange={toggleSwitch}
            value={isEnabled}
            // disabled={isUpdating}
          />
          {/* {isUpdating && <Text style={styles.loadingText}>업데이트 중...</Text>} */}
        </View>
      </View>
    </View>
  );
};

const Comment: React.FC<CommentProps> = ({ user, comment, dataTime }) => {
  return (
    <View style={styles.commentContainer}>
      <View style={styles.commentIconContainer}>
        <Ionicons name="person-circle-outline" size={40} color="#007AFF" />
      </View>
      <View style={styles.commentContent}>
        <Text style={styles.commentUser}>{user}</Text>
        <Text style={styles.commentComment}>{comment}</Text>
        <Text style={styles.commentDataTime}>{dataTime}</Text>
      </View>
    </View>
  );
};

const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const [commentText, setCommentText] = useState("");
  const inputRef = useRef<TextInput>(null);

  const handleSubmit = () => {
    if (commentText.trim() && !isLoading) {
      onSubmit(commentText);
      setCommentText("");
      // 제출 후 포커스 해제
      inputRef.current?.blur();
    }
  };

  return (
    <View style={styles.commentFormContainer}>
      <View style={styles.commentFormInputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.commentFormInput}
          placeholder="댓글을 입력하세요..."
          value={commentText}
          onChangeText={setCommentText}
          multiline
          numberOfLines={1}
          returnKeyType="done"
          editable={!isLoading}
        />
      </View>
      <TouchableOpacity
        style={[
          styles.commentFormButton,
          (!commentText.trim() || isLoading) &&
            styles.commentFormButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!commentText.trim() || isLoading}
      >
        <Text style={styles.commentFormButtonText}>
          {isLoading ? "등록 중..." : "등록"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const WorkHistory: React.FC<WorkHistoryProps> = ({
  dateTime,
  action,
  user,
}) => {
  return (
    <View style={styles.workHistoryContainer}>
      <View style={styles.workHistoryLeft}>
        <Text style={styles.workHistoryAction}>{action}</Text>
      </View>
      <View style={styles.workHistoryRight}>
        <Text style={styles.workHistoryUser}>{user}</Text>
        <Text style={styles.workHistoryDateTime}>[{dateTime}]</Text>
      </View>
    </View>
  );
};

export default function TaskDetailScreen() {
  const router = useRouter();
  const { selectedTask, clearSelectedTask, setSelectedTask } = useTaskStore();
  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const authAdminKey = (user as any)?.adminKey || (user as any)?.id;

  // 탭 포커스 시 스크롤을 맨 위로 이동
  useFocusEffect(
    React.useCallback(() => {
      // 약간의 지연을 두어 컴포넌트가 완전히 렌더링된 후 스크롤 실행
      const timer = setTimeout(() => {
        if (scrollViewRef.current) {
          // KeyboardAwareScrollView의 내부 ScrollView에 접근
          const scrollView = (
            scrollViewRef.current as any
          ).getScrollResponder();
          if (scrollView && scrollView.scrollTo) {
            scrollView.scrollTo({ x: 0, y: 0, animated: true });
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    }, [])
  );

  // 개별 작업 데이터 패칭
  const taskKey =
    (selectedTask as any)?.TASK_KEY || (selectedTask as any)?.task_key;
  const {
    data: taskData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["task-detail", taskKey],
    queryFn: () => fetchTaskDetail(taskKey),
    enabled: !!taskKey, // taskKey가 있을 때만 실행
    staleTime: 1000 * 60 * 5, // 5분
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // 작업 업데이트 mutation (컴포넌트 최상위 레벨에서 호출)
  const updateTaskMutation = useMutation({
    mutationFn: updateTask,
  });

  // 작업 전체 상태 업데이트 mutation
  const updateProgressingMutation = useMutation({
    mutationFn: updateTaskProgressing,
  });
  const { sendNotification } = usePushStore();

  // 댓글 추가 mutation
  const createCommentMutation = useMutation({
    mutationFn: createComment,
    onSuccess: (data) => {
      console.log("댓글 추가 성공:", data);
      // 댓글 추가 후 작업 상세 데이터 리페치
      queryClient.invalidateQueries({ queryKey: ["task-detail", taskKey] });
    },
    onError: (error) => {
      console.error("댓글 추가 실패:", error);
      Alert.alert("오류", "댓글 추가에 실패했습니다.");
    },
  });

  // 로그 추가 mutation
  const createLogMutation = useMutation({
    mutationFn: createLog,
    onSuccess: (data) => {
      console.log("로그 추가 성공:", data);
      // 로그 추가 후 작업 상세 데이터 리페치
      queryClient.invalidateQueries({ queryKey: ["task-detail", taskKey] });
    },
    onError: (error) => {
      console.error("로그 추가 실패:", error);
      // 로그 추가 실패는 사용자에게 알리지 않음 (조용히 실패)
    },
  });

  // 공정 상태 변경 처리
  const handleProcessStatusChange = (
    processIndex: number,
    newStatus: "완료" | "미완료"
  ) => {
    if (!taskData) return;

    // 패칭된 데이터 사용
    const task = taskData;

    // 현재 TASK_DETAIL 파싱
    const currentTaskDetail = parseTaskDetail(task.TASK_DETAIL);

    // 업데이트된 process 배열 생성
    const updatedProcess = currentTaskDetail.process.map((process, index) => {
      if (index === processIndex) {
        return { ...process, process_status: newStatus };
      }
      return process;
    });

    // 업데이트된 TASK_DETAIL 객체 생성
    const updatedTaskDetail = {
      ...currentTaskDetail,
      process: updatedProcess,
    };

    // API 호출
    updateTaskMutation.mutate(
      {
        taskKey: task.TASK_KEY,
        taskDetail: updatedTaskDetail,
      },
      {
        onSuccess: (data) => {
          // 상태 변경 로그
          const category =
            currentTaskDetail.process[processIndex]?.process_category || "";
          const prev =
            currentTaskDetail.process[processIndex]?.process_status || "";
          const next = newStatus;
          createLogMutation.mutate({
            taskKey: task.TASK_KEY,
            adminKey: authAdminKey || task.ADMIN_KEY || "tk",
            logContent: `[${category}] ${next}`,
          });
          // 푸시 알림 전송 (공정)
          sendNotification(
            "공정 알림",
            `[${task.TASK_TITLE}] ${category} - ${next}`,
            task.TASK_KEY
          );

          // 성공 시 로컬 상태 업데이트
          const updatedTask = {
            ...task,
            TASK_DETAIL: JSON.stringify(updatedTaskDetail), // 로컬 상태는 JSON 문자열로 저장
          };

          // store 업데이트
          clearSelectedTask();
          setSelectedTask(updatedTask);

          // 캐시 무효화
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          queryClient.invalidateQueries({ queryKey: ["tasks-count"] });
          queryClient.invalidateQueries({ queryKey: ["task-detail", taskKey] });
        },
        onError: (error) => {
          Alert.alert("오류", "상태 업데이트에 실패했습니다.");
          if (selectedTask) {
            const task = selectedTask as any;
            clearSelectedTask();
            setSelectedTask(task);
          }
        },
      }
    );
  };

  // 패칭된 데이터에서 댓글과 로그 추출
  const comments = React.useMemo(() => {
    if (!taskData?.tb_task_comment) return [];

    return taskData.tb_task_comment.map((comment: any, index: number) => ({
      id: comment.COMMENT_KEY || index + 1,
      user: comment.tb_admin_user?.ADMIN_NAME || "사용자",
      comment: comment.COMMENT_CONTENT || "",
      dataTime: comment.CREATED_AT
        ? new Date(comment.CREATED_AT).toLocaleString("ko-KR")
        : "",
    }));
  }, [taskData?.tb_task_comment]);

  const workHistory = React.useMemo(() => {
    if (!taskData?.tb_task_log) return [];

    return taskData.tb_task_log.map((log: any, index: number) => ({
      id: log.LOG_KEY || index + 1,
      dateTime: log.CREATED_AT
        ? new Date(log.CREATED_AT).toLocaleString("ko-KR")
        : "",
      action: log.LOG_CONTENT || "",
      user: log.tb_admin_user?.ADMIN_NAME || "사용자",
    }));
  }, [taskData?.tb_task_log]);

  // 로그 클라이언트 페이징 상태
  const [logPage, setLogPage] = React.useState(1);
  const logPageSize = 5;
  React.useEffect(() => {
    setLogPage(1);
  }, [taskKey]);
  const pagedWorkHistory = React.useMemo(() => {
    return Array.isArray(workHistory)
      ? workHistory.slice(0, logPage * logPageSize)
      : [];
  }, [workHistory, logPage]);

  // TASK_DETAIL JSON 파싱 헬퍼 함수
  const parseTaskDetail = (taskDetailString: string): TaskDetail => {
    try {
      // 이미 객체인 경우 바로 반환
      if (typeof taskDetailString === "object" && taskDetailString !== null) {
        return taskDetailString as TaskDetail;
      }

      // 문자열이 아닌 경우 기본값 반환
      if (typeof taskDetailString !== "string") {
        return {
          delivery_type: "",
          task_desc: "",
          paper_size: "",
          product_size: "",
          paper_type: "",
          process: [],
        };
      }

      // 빈 문자열이거나 null/undefined인 경우
      if (!taskDetailString || taskDetailString.trim() === "") {
        return {
          delivery_type: "",
          task_desc: "",
          paper_size: "",
          product_size: "",
          paper_type: "",
          process: [],
        };
      }

      const parsed = JSON.parse(taskDetailString);
      return parsed;
    } catch (error) {
      console.error("TASK_DETAIL 파싱 오류:", error);
      return {
        delivery_type: "",
        task_desc: "",
        paper_size: "",
        product_size: "",
        paper_type: "",
        process: [],
      };
    }
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch (error) {
      console.error("날짜 포맷팅 오류:", error);
      return dateString || "날짜 없음";
    }
  };

  const handleAddComment = (commentText: string) => {
    if (!taskData || !commentText.trim()) return;

    // 댓글 추가 API 호출
    createCommentMutation.mutate({
      taskKey: taskData.TASK_KEY,
      adminKey: authAdminKey || taskData.ADMIN_KEY || "tk",
      commentContent: commentText.trim(),
    });
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.noDataContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.noDataText}>데이터를 불러오는 중...</Text>
        </View>
      </View>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.noDataContainer}>
          <Ionicons name="alert-circle-outline" size={50} color="#FF6B6B" />
          <Text style={styles.noDataText}>
            데이터를 불러오는데 실패했습니다.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 데이터가 없는 경우
  if (!taskData) {
    return (
      <View style={styles.container}>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>선택된 작업이 없습니다.</Text>
        </View>
      </View>
    );
  }

  // 패칭된 데이터 사용
  const task = taskData;

  // TASK_DETAIL 파싱
  const taskDetail = parseTaskDetail(task.TASK_DETAIL);

  return (
    <KeyboardAwareScrollView
      ref={scrollViewRef}
      style={styles.container} // container 스타일을 여기에 적용
      contentContainerStyle={styles.content} // content 스타일을 여기에 적용
      enableOnAndroid={true}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
      // 라이브러리가 자동으로 계산한 스크롤 양에 추가 값을 더해 입력창이 가려지지 않게 합니다.
      extraScrollHeight={50}
      // 키보드가 열릴 때 입력창에 자동으로 스크롤하도록 설정
      enableAutomaticScroll={true}
      // 키보드가 닫힐 때 자동 스크롤 리셋 비활성화 (입력창 위치 유지)
      enableResetScrollToCoords={false}
      // 키보드 열림 지연 시간을 0으로 설정하여 즉시 반응
      keyboardOpeningTime={0}
    >
      {/* 작업 정보 카드 */}
      <View style={styles.taskCard}>
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle}>{task.TASK_TITLE || "제목 없음"}</Text>
          <View style={styles.taskClientContainer}>
            <Ionicons name="business-outline" size={16} color="#999" />
            <Text style={styles.clientText}>
              {task.TASK_COMPANY || "고객명 없음"}
            </Text>
          </View>
        </View>

        <View style={styles.statusAndPriority}>
          <Text style={getPriorityStyle(task.TASK_PRIORITY || "보통") as any}>
            {task.TASK_PRIORITY || "보통"}
          </Text>
          <Text style={getStatusStyle(task.TASK_PROGRESSING || "대기") as any}>
            {task.TASK_PROGRESSING || "대기"}
          </Text>
        </View>
        {/* 날짜 */}
        <View style={styles.dateContainer}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>발주일</Text>
            <Text style={styles.dateValue}>
              {task.TASK_ORDER_DATE
                ? formatDate(task.TASK_ORDER_DATE)
                : "날짜 없음"}
            </Text>
          </View>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>납품일</Text>
            <Text style={styles.dateValue}>
              {task.TASK_DELIVERY_DATE
                ? formatDate(task.TASK_DELIVERY_DATE)
                : "날짜 없음"}
            </Text>
          </View>
        </View>
      </View>

      {/* 작업 상태 변경 카드 */}
      <View style={styles.Card}>
        <Text style={styles.CardTitle}>작업 상태</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            style={[
              styles.stateButton,
              task.TASK_PROGRESSING === "진행중" && styles.stateButtonActive,
            ]}
            disabled={updateProgressingMutation.isPending}
            onPress={() => {
              if (task.TASK_PROGRESSING === "진행중") return;
              if (updateProgressingMutation.isPending) return;
              updateProgressingMutation.mutate(
                { taskKey: task.TASK_KEY, progressing: "진행중" },
                {
                  onSuccess: () => {
                    createLogMutation.mutate({
                      taskKey: task.TASK_KEY,
                      adminKey: authAdminKey || task.ADMIN_KEY || "tk",
                      logContent: `${task.TASK_PROGRESSING} -> 진행중`,
                    });
                    sendNotification(
                      "작업 알림",
                      `[${task.TASK_TITLE}] 진행중`,
                      task.TASK_KEY
                    );
                    queryClient.invalidateQueries({ queryKey: ["tasks"] });
                    queryClient.invalidateQueries({
                      queryKey: ["tasks-count"],
                    });
                    queryClient.invalidateQueries({
                      queryKey: ["task-detail", taskKey],
                    });
                  },
                  onError: () => Alert.alert("오류", "작업 상태 업데이트 실패"),
                }
              );
            }}
          >
            {updateProgressingMutation.isPending ? (
              <ActivityIndicator size="small" color="#4CAF50" />
            ) : (
              <Text style={styles.stateButtonText}>진행중</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.stateButton,
              task.TASK_PROGRESSING === "완료" && styles.stateButtonActive,
            ]}
            disabled={updateProgressingMutation.isPending}
            onPress={() => {
              if (task.TASK_PROGRESSING === "완료") return;
              if (updateProgressingMutation.isPending) return;
              updateProgressingMutation.mutate(
                { taskKey: task.TASK_KEY, progressing: "완료" },
                {
                  onSuccess: () => {
                    createLogMutation.mutate({
                      taskKey: task.TASK_KEY,
                      adminKey: authAdminKey || task.ADMIN_KEY || "tk",
                      logContent: `${task.TASK_PROGRESSING} -> 완료`,
                    });
                    sendNotification(
                      "작업 상태 변경",
                      `[${task.TASK_TITLE}] 완료`,
                      task.TASK_KEY
                    );
                    queryClient.invalidateQueries({ queryKey: ["tasks"] });
                    queryClient.invalidateQueries({
                      queryKey: ["tasks-count"],
                    });
                    queryClient.invalidateQueries({
                      queryKey: ["task-detail", taskKey],
                    });
                  },
                  onError: () => Alert.alert("오류", "작업 상태 업데이트 실패"),
                }
              );
            }}
          >
            {updateProgressingMutation.isPending ? (
              <ActivityIndicator size="small" color="#4CAF50" />
            ) : (
              <Text style={styles.stateButtonText}>완료</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 타임라인 섹션 */}
      <View style={styles.Card}>
        <Text style={styles.CardTitle}>진행 상황</Text>
        <View style={styles.timeline}>
          {(taskDetail.process || []).map(
            (process: ProcessItem, index: number) => (
              <View
                key={`${task.TASK_KEY}-timeline-${index}`}
                style={styles.timelineItem}
              >
                <View
                  style={[
                    styles.timelineDot,
                    process.process_status === "완료" &&
                      styles.timelineDotActive,
                  ]}
                />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineText}>
                    {process.process_category || "카테고리 없음"}
                  </Text>
                  <Text
                    style={styles.timelineCompany}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {process.process_company || "업체 없음"}
                  </Text>
                </View>
              </View>
            )
          )}
        </View>
      </View>

      {/* 상세 정보 */}
      <View style={styles.Card}>
        <Text style={styles.CardTitle}>상세정보</Text>
        <DetailItem
          label="설명"
          value={taskDetail.task_desc || "설명 없음"}
          minHeight={100}
        />
        <DetailItem
          label="용지"
          value={taskDetail.paper_type || "용지 정보 없음"}
        />
        <DetailItem
          label="용지사이즈"
          value={taskDetail.paper_size || "사이즈 정보 없음"}
        />
        <DetailItem
          label="개별사이즈"
          value={taskDetail.product_size || "개별 사이즈 정보 없음"}
        />
        <DetailItem
          label="납품방식"
          value={taskDetail.delivery_type || "납품 방식 정보 없음"}
        />
        {(taskDetail.process || []).map(
          (process: ProcessItem, index: number) => (
            <DetailFinish
              key={`${task.TASK_KEY}-process-${index}`}
              label={process.process_category || "카테고리 없음"}
              title={process.process_type || "타입 없음"}
              company={process.process_company || "업체 없음"}
              tel={process.process_company_tel || ""}
              enabled={process.process_status === "완료"}
              taskKey={task.TASK_KEY}
              processIndex={index}
              onStatusChange={handleProcessStatusChange}
              isUpdating={updateTaskMutation.isPending}
            />
          )
        )}
      </View>

      {/* 댓글 섹션 */}
      <View style={styles.Card}>
        <Text style={styles.CardTitle}>댓글</Text>
        {comments.length > 0 ? (
          comments.map((comment: any) => (
            <Comment
              key={comment.id}
              user={comment.user}
              comment={comment.comment}
              dataTime={comment.dataTime}
            />
          ))
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>댓글이 없습니다.</Text>
          </View>
        )}
        {/* CommentForm을 원래 위치로 복원합니다. */}
        <CommentForm
          onSubmit={handleAddComment}
          isLoading={createCommentMutation.isPending}
        />
      </View>

      {/* 이력 섹션 */}
      <View style={styles.Card}>
        <Text style={styles.CardTitle}>이력</Text>
        {pagedWorkHistory.length > 0 ? (
          pagedWorkHistory.map((history: any) => (
            <WorkHistory
              key={history.id}
              dateTime={history.dateTime}
              action={history.action}
              user={history.user}
            />
          ))
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>작업 이력이 없습니다.</Text>
          </View>
        )}
        {pagedWorkHistory.length < workHistory.length ? (
          <TouchableOpacity
            onPress={() => setLogPage((p) => p + 1)}
            style={{
              marginTop: 10,
              alignSelf: "center",
              backgroundColor: "#E0E0E0",
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#333", fontWeight: "600" }}>더 보기</Text>
          </TouchableOpacity>
        ) : workHistory.length > 0 && logPage > 1 ? (
          <TouchableOpacity
            onPress={() => setLogPage(1)}
            style={{
              marginTop: 10,
              alignSelf: "center",
              backgroundColor: "#E0E0E0",
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#333", fontWeight: "600" }}>접기</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </KeyboardAwareScrollView>
  );
}

// 상태 및 우선순위 스타일 함수 (이전과 동일)
const getStatusStyle = (status: string) => {
  switch (status) {
    case "진행중":
      return [styles.statusTag, styles.statusInProgress];
    case "대기":
      return [styles.statusTag, styles.statusWaiting];
    case "완료":
      return [styles.statusTag, styles.statusCompleted];
    default:
      return styles.statusTag;
  }
};
const getPriorityStyle = (priority: string) => {
  switch (priority) {
    case "긴급":
      return [styles.priorityTag, styles.priorityUrgent];
    case "보통":
      return [styles.priorityTag, styles.priorityNormal];
    default:
      return styles.priorityTag;
  }
};

// 스타일시트 (원래 디자인으로 복원)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F2F5",
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    fontSize: 16,
    color: "#666",
  },
  taskCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  taskClientContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  clientText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 5,
  },
  statusAndPriority: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    gap: 8,
  },
  statusTag: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 15,
    fontSize: 13,
    fontWeight: "bold",
  },
  statusInProgress: {
    backgroundColor: "#E3F2FD",
    color: "#2196F3",
  },
  statusWaiting: {
    backgroundColor: "#FFF3E0",
    color: "#FF9800",
  },
  statusCompleted: {
    backgroundColor: "#E8F5E9",
    color: "#4CAF50",
  },
  priorityTag: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 15,
    fontSize: 13,
    fontWeight: "bold",
  },
  priorityUrgent: {
    backgroundColor: "#FFEBEE",
    color: "#F44336",
  },
  priorityNormal: {
    backgroundColor: "#E0F7FA",
    color: "#00BCD4",
  },
  dateContainer: {
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 15,
  },
  dateItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  dateValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  Card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  CardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  timeline: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F0F0F0",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    paddingTop: 15,
  },
  timelineItem: {
    alignItems: "center",
    width: "20%",
    marginBottom: 15,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ddd",
    marginBottom: 6,
  },
  timelineDotActive: {
    backgroundColor: "#007AFF",
  },
  timelineContent: {
    alignItems: "center",
  },
  timelineText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 2,
    textAlign: "center",
  },
  timelineCompany: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#999",
    textAlign: "center",
  },
  timelineTime: {
    fontSize: 10,
    color: "#999",
    textAlign: "center",
  },
  detailContainer: {
    flexDirection: "column",
    justifyContent: "flex-start",
    gap: 8,
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "#b6b6b6",
    borderRadius: 10,
    padding: 10,
  },
  finishContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#b6b6b6",
    borderRadius: 10,
    padding: 10,
  },
  finishBox: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
    justifyContent: "center",
  },
  finishTitle: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  finishCompany: {
    fontSize: 12,
    color: "#666",
  },
  phoneButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },
  phoneText: {
    fontSize: 12,
    color: "#007AFF",
    marginLeft: 5,
  },
  commentContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderBottomWidth: 1,
    borderColor: "#F0F0F0",
  },
  commentIconContainer: {
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  commentComment: {
    fontSize: 14,
    color: "#6938EF",
    fontWeight: "bold",
    marginBottom: 10,
  },
  commentDataTime: {
    fontSize: 14,
    color: "#999",
  },
  // CommentForm 스타일 원상 복구
  commentFormContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  commentFormInputContainer: {
    flex: 1,
    marginRight: 10,
  },
  commentFormInput: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: "#333",
  },
  commentFormButton: {
    backgroundColor: "#007AFF",
    height: 35,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  commentFormButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.7,
  },
  commentFormButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  workHistoryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  workHistoryLeft: {
    flexDirection: "column",
    alignItems: "flex-start",
    marginRight: 10,
  },
  workHistoryRight: {
    flexDirection: "column",
    alignItems: "flex-end",
    marginLeft: 10,
  },

  workHistoryAction: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    marginRight: 10,
  },
  workHistoryUser: {
    fontSize: 12,
    color: "#333",
    fontWeight: "600",
    marginRight: 5,
  },
  workHistoryDateTime: {
    fontSize: 12,
    color: "#999",
  },
  loadingText: {
    fontSize: 10,
    color: "#007AFF",
    marginTop: 5,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptySection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  statusToggle: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: "#E3F2FD",
  },
  stateButton: {
    flex: 1,
    backgroundColor: "#EFEFEF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  stateButtonActive: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  stateButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
});
