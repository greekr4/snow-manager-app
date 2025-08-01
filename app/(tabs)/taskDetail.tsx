import { useTaskStore } from "@/stores/taskStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
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
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

// 타입 정의
interface ProcessItem {
  process_category: string;
  process_type: string;
  process_company: string;
  process_company_tel: string;
  process_stauts: string;
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
  id: number;
  task_title: string;
  task_company: string;
  task_progressing: string;
  task_priority: string;
  task_detail: TaskDetail;
  task_order_date: string;
  task_delivery_date: string;
}

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
}) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const toggleSwitch = () => setIsEnabled((previousState) => !previousState);

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
          <Switch onValueChange={toggleSwitch} value={isEnabled} />
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

const CommentForm: React.FC<CommentFormProps> = ({ onSubmit }) => {
  const [commentText, setCommentText] = useState("");
  const inputRef = useRef<TextInput>(null);

  const handleSubmit = () => {
    if (commentText.trim()) {
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
        />
      </View>
      <TouchableOpacity
        style={[
          styles.commentFormButton,
          !commentText.trim() && styles.commentFormButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!commentText.trim()}
      >
        <Text style={styles.commentFormButtonText}>등록</Text>
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
  const { selectedTask, clearSelectedTask } = useTaskStore();
  const [comments, setComments] = useState([
    {
      id: 1,
      user: "김철수",
      comment: "인쇄 작업이 완료되었습니다. 다음 단계로 진행하겠습니다.",
      dataTime: "2024-01-15 14:30",
    },
    {
      id: 2,
      user: "이영희",
      comment: "코팅 작업 시작하겠습니다.",
      dataTime: "2024-01-15 16:45",
    },
  ]);

  const [workHistory, setWorkHistory] = useState([
    {
      id: 1,
      dateTime: "2024-01-15 14:30",
      action: "인쇄 완료",
      user: "김태균",
    },
    {
      id: 2,
      dateTime: "2024-01-15 16:45",
      action: "코팅 시작",
      user: "이영희",
    },
    {
      id: 3,
      dateTime: "2024-01-15 18:20",
      action: "코팅 완료",
      user: "이영희",
    },
    {
      id: 4,
      dateTime: "2024-01-16 09:15",
      action: "금박 시작",
      user: "박민수",
    },
    {
      id: 5,
      dateTime: "2024-01-16 11:30",
      action: "금박 완료",
      user: "박민수",
    },
  ]);

  const handleAddComment = (commentText: string) => {
    const newComment = {
      id: comments.length + 1,
      user: "현재 사용자",
      comment: commentText,
      dataTime: new Date().toLocaleString("ko-KR"),
    };
    setComments([...comments, newComment]);
  };

  if (!selectedTask) {
    return (
      <View style={styles.container}>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>선택된 작업이 없습니다.</Text>
        </View>
      </View>
    );
  }

  // selectedTask를 JobData 타입으로 캐스팅
  const task = selectedTask as any;

  return (
    <KeyboardAwareScrollView
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
          <Text style={styles.taskTitle}>{task.task_title}</Text>
          <View style={styles.taskClientContainer}>
            <Ionicons name="business-outline" size={16} color="#999" />
            <Text style={styles.clientText}>{task.task_company}</Text>
          </View>
        </View>

        <View style={styles.statusAndPriority}>
          <Text style={getPriorityStyle(task.task_priority)}>
            {task.task_priority}
          </Text>
          <Text style={getStatusStyle(task.task_progressing)}>
            {task.task_progressing}
          </Text>
        </View>
        <View style={styles.dateContainer}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>발주일</Text>
            <Text style={styles.dateValue}>{task.task_order_date}</Text>
          </View>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>납품일</Text>
            <Text style={styles.dateValue}>{task.task_delivery_date}</Text>
          </View>
        </View>
      </View>

      {/* 타임라인 섹션 */}
      <View style={styles.Card}>
        <Text style={styles.CardTitle}>진행 상황</Text>
        <View style={styles.timeline}>
          {task.task_detail.process.map(
            (process: ProcessItem, index: number) => (
              <View key={index} style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    process.process_stauts === "완료" &&
                      styles.timelineDotActive,
                  ]}
                />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineText}>
                    {process.process_category}
                  </Text>
                  <Text
                    style={styles.timelineCompany}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {process.process_company}
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
          value={task.task_detail.task_desc}
          minHeight={100}
        />
        <DetailItem label="용지" value={task.task_detail.paper_type} />
        <DetailItem label="용지사이즈" value={task.task_detail.paper_size} />
        <DetailItem label="개별사이즈" value={task.task_detail.product_size} />
        <DetailItem label="납품방식" value={task.task_detail.delivery_type} />
        {task.task_detail.process.map((process: ProcessItem, index: number) => (
          <DetailFinish
            key={index}
            label={process.process_category}
            title={process.process_type}
            company={process.process_company}
            tel={process.process_company_tel}
          />
        ))}
      </View>

      {/* 댓글 섹션 */}
      <View style={styles.Card}>
        <Text style={styles.CardTitle}>댓글</Text>
        {comments.map((comment) => (
          <Comment
            key={comment.id}
            user={comment.user}
            comment={comment.comment}
            dataTime={comment.dataTime}
          />
        ))}
        {/* CommentForm을 원래 위치로 복원합니다. */}
        <CommentForm onSubmit={handleAddComment} />
      </View>

      {/* 이력 섹션 */}
      <View style={styles.Card}>
        <Text style={styles.CardTitle}>이력</Text>
        {workHistory.map((history) => (
          <WorkHistory
            key={history.id}
            dateTime={history.dateTime}
            action={history.action}
            user={history.user}
          />
        ))}
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
    flexDirection: "row",
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
});
