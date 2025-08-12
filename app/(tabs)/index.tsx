import { TabBarMargin } from "@/components/global/TabBarMargin";
import { useTaskStore } from "@/stores/taskStore";
import { Ionicons } from "@expo/vector-icons";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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

interface PaginatedResponse {
  data: JobData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

// API 함수들
const fetchTasks = async ({
  pageParam = 1,
  status = "",
}): Promise<PaginatedResponse> => {
  // 일시적으로 서버 필터링 비활성화 (서버에서 제대로 필터링이 안 되므로)
  let url = `https://snowplanet.co.kr/nest/tasks?page=${pageParam}&limit=10`;

  // TODO: 서버에서 필터링이 제대로 작동하면 아래 주석 해제
  // if (status && status !== "전체") {
  //   url += `&status=${encodeURIComponent(status)}`;
  // }

  const response = await axios.get(url);
  return response.data;
};

// 개수만 가져오는 API
const fetchTaskCounts = async () => {
  const response = await axios.get("https://snowplanet.co.kr/nest/tasks/count");
  return response.data;
};

export default function HomeScreen() {
  const [isModalVisible, setModalVisible] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobClient, setNewJobClient] = useState("");
  const [selectedTab, setSelectedTab] = useState("전체");

  const router = useRouter();
  const { setSelectedTask } = useTaskStore();
  const queryClient = useQueryClient();

  // 개수 전용 쿼리
  const { data: taskCounts, refetch: refetchCounts } = useQuery({
    queryKey: ["tasks-count"],
    queryFn: fetchTaskCounts,
    staleTime: 1000 * 60 * 5, // 5분
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // React Query Infinite Query로 데이터 페칭 (클라이언트 필터링 사용)
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    refetch,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["tasks"], // selectedTab 제거 (클라이언트 필터링 사용)
    queryFn: ({ pageParam = 1 }) =>
      fetchTasks({ pageParam, status: selectedTab }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNextPage
        ? lastPage.pagination.page + 1
        : undefined;
    },
    staleTime: 1000 * 60 * 2, // 2분
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // 모든 페이지의 데이터를 하나의 배열로 평탄화 (안전한 처리)
  const allJobs = React.useMemo(() => {
    try {
      if (!data || !data.pages) {
        console.log(`[${selectedTab}] 데이터가 없습니다:`, data);
        return [];
      }

      const jobs = data.pages.flatMap((page) => {
        if (!page || !Array.isArray(page.data)) {
          console.log(`[${selectedTab}] 잘못된 페이지 데이터:`, page);
          return [];
        }
        return page.data;
      });

      // 중복된 TASK_KEY 제거 (무한 스크롤에서 발생할 수 있는 중복 방지)
      const uniqueJobs = jobs.filter((job, index, self) => {
        if (!job?.TASK_KEY) return true; // TASK_KEY가 없는 경우는 유지
        return index === self.findIndex((j) => j?.TASK_KEY === job.TASK_KEY);
      });

      console.log(`[${selectedTab}] 서버에서 받은 총 작업 수:`, jobs.length);
      console.log(`[${selectedTab}] 중복 제거 후 작업 수:`, uniqueJobs.length);

      return uniqueJobs;
    } catch (error) {
      console.error(`[${selectedTab}] allJobs 생성 오류:`, error);
    }
  }, [data, selectedTab]);

  // 클라이언트 사이드 필터링 (서버 필터링이 제대로 안 될 때를 대비)
  const filteredJobs = React.useMemo(() => {
    try {
      if (!Array.isArray(allJobs)) {
        console.log(`[${selectedTab}] allJobs가 배열이 아닙니다:`, allJobs);
        return [];
      }

      let filtered;
      if (selectedTab === "전체") {
        filtered = allJobs;
      } else {
        filtered = allJobs.filter((job: any) => {
          if (!job) return false;
          return job.TASK_PROGRESSING === selectedTab;
        });
      }

      console.log(
        `[${selectedTab}] 클라이언트 필터링 후 작업 수:`,
        filtered.length
      );

      // 필터링된 결과의 첫 번째 작업 상태 확인
      if (filtered.length > 0) {
        const firstFilteredJobStatus = filtered[0].TASK_PROGRESSING;
        console.log(
          `[${selectedTab}] 필터링 후 첫 번째 작업 상태:`,
          firstFilteredJobStatus
        );
      }

      return filtered;
    } catch (error) {
      console.error(`[${selectedTab}] 필터링 오류:`, error);
      return [];
    }
  }, [allJobs, selectedTab]);

  // 탭 포커스시 데이터 리페치
  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchCounts();
    }, [refetch, refetchCounts])
  );

  // 수동 새로고침
  const handleRefresh = useCallback(() => {
    refetch();
    refetchCounts(); // 개수도 함께 새로고침
  }, [refetch, refetchCounts]);

  // 무한스크롤 로드 더보기
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleDetailView = (job: any) => {
    setSelectedTask(job);
    router.push("/(tabs)/taskDetail");
  };

  const handleMenuPress = (id: any) => {
    if (id === "new_job") {
      setModalVisible(true);
    } else {
      Alert.alert("알림", `${id} 메뉴는 준비 중입니다.`);
    }
  };

  // 탭 선택 시 처리 - 개선된 버전
  const handleTabChange = useCallback(
    (tab: string) => {
      console.log(`탭 변경: ${selectedTab} -> ${tab}`);
      setSelectedTab(tab);
      // selectedTab이 queryKey에 포함되어 있으므로 자동으로 새로운 데이터 페칭
    },
    [selectedTab]
  );

  // 탭별 개수 가져오기
  const getTabCount = useCallback(
    (tab: string) => {
      if (!taskCounts) return 0;

      switch (tab) {
        case "전체":
          return taskCounts.total || 0;
        case "진행중":
          return taskCounts.진행중 || 0;
        case "완료":
          return taskCounts.완료 || 0;
        default:
          return 0;
      }
    },
    [taskCounts]
  );

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // FlatList 아이템 렌더링
  const renderJobItem = ({ item: job }: { item: any }) => {
    if (!job) {
      console.log("renderJobItem: job이 null/undefined입니다");
      return null;
    }

    const taskDetail = parseTaskDetail(job.TASK_DETAIL);
    return (
      <View style={styles.jobCard}>
        <View style={styles.jobCardHeader}>
          <Text style={styles.jobTitle}>{job.TASK_TITLE || "제목 없음"}</Text>
          <View style={styles.jobClientContainer}>
            <Ionicons name="business-outline" size={16} color="#999" />
            <Text style={styles.clientText}>
              {job.TASK_COMPANY || "고객명 없음"}
            </Text>
          </View>
        </View>
        <View style={styles.statusAndPriority}>
          <Text style={getPriorityStyle(job.TASK_PRIORITY || "보통")}>
            {job.TASK_PRIORITY || "보통"}
          </Text>
          <Text style={getStatusStyle(job.TASK_PROGRESSING || "대기")}>
            {job.TASK_PROGRESSING || "대기"}
          </Text>
        </View>
        <View style={styles.detailsContainer}>
          {(taskDetail.process || []).map((process: any, index: any) => (
            <Text
              key={`${job.TASK_KEY}-detail-${index}`}
              style={[
                styles.detailTag,
                process.process_status === "완료" && styles.detailTagActive,
              ]}
            >
              {process.process_category || "카테고리 없음"}
            </Text>
          ))}
        </View>

        {/* 타임라인 섹션 */}
        <View style={styles.timelineContainer}>
          <Text style={styles.timelineTitle}>진행 상황</Text>
          <View style={styles.timeline}>
            {(taskDetail.process || []).map((process: any, index: any) => (
              <View
                key={`${job.TASK_KEY}-timeline-${index}`}
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
                  <Text
                    style={styles.timelineText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
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
            ))}
          </View>
        </View>

        <View style={styles.jobCardFooter}>
          <View>
            <Text style={styles.jobTime}>
              발주일:{" "}
              {job.TASK_ORDER_DATE
                ? formatDate(job.TASK_ORDER_DATE)
                : "날짜 없음"}
            </Text>
            <Text style={styles.jobTime}>
              납품일:{" "}
              {job.TASK_DELIVERY_DATE
                ? formatDate(job.TASK_DELIVERY_DATE)
                : "날짜 없음"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => handleDetailView(job)}
          >
            <Text style={styles.detailButtonText}>상세보기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // FlatList 하단 로딩 인디케이터
  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.footerLoaderText}>
          더 많은 작업을 불러오는 중...
        </Text>
      </View>
    );
  };

  // FlatList 헤더 (탭 메뉴)
  const renderHeader = () => (
    <>
      {/* --- 상단 헤더 --- */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>작업 관리</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={isFetching}
        >
          <Ionicons
            name="refresh"
            size={24}
            color={isFetching ? "#999" : "#007AFF"}
          />
        </TouchableOpacity>
      </View>

      {/* --- 상단 탭 메뉴 --- */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          {["전체", "진행중", "완료"].map((tab, index) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabItem,
                selectedTab === tab && styles.tabItemActive,
              ]}
              onPress={() => handleTabChange(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
              <View
                style={[
                  styles.tabBadge,
                  selectedTab === tab && styles.tabBadgeActive,
                ]}
              >
                <Text style={styles.tabBadgeText}>{getTabCount(tab)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <View
          style={[
            styles.tabIndicator,
            {
              left:
                selectedTab === "전체"
                  ? "0%"
                  : selectedTab === "진행중"
                  ? "33.33%"
                  : "66.66%",
            },
          ]}
        />
      </View>
    </>
  );

  if (isLoading) {
    return (
      <View
        style={[
          styles.rootContainer,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10, color: "#666" }}>
          데이터를 불러오는 중...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.rootContainer,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Ionicons name="alert-circle-outline" size={50} color="#FF6B6B" />
        <Text style={{ marginTop: 10, color: "#666", textAlign: "center" }}>
          데이터를 불러오는데 실패했습니다.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.rootContainer}>
      <FlatList
        data={Array.isArray(filteredJobs) ? filteredJobs : []}
        renderItem={renderJobItem}
        keyExtractor={(item, index) => item?.TASK_KEY || `job-${index}`}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isFetchingNextPage}
            onRefresh={handleRefresh}
            colors={["#007AFF"]}
            tintColor="#007AFF"
          />
        }
        contentContainerStyle={styles.flatListContainer}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        extraData={selectedTab} // 탭 변경시 FlatList 리렌더링 강제
        ListEmptyComponent={() =>
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={50} color="#ccc" />
              <Text style={styles.emptyText}>
                {selectedTab} 작업이 없습니다.
              </Text>
            </View>
          ) : null
        }
      />

      {/* 탭바 높이만큼 하단 마진 */}
      <TabBarMargin />

      {/* --- 새 작업 등록 팝업(Modal) --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => {
          setModalVisible(!isModalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>새 작업 등록</Text>
            <TextInput
              style={styles.input}
              placeholder="작업명 (예: 브로셔 500부)"
              value={newJobTitle}
              onChangeText={setNewJobTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="고객명 (예: (주)스노우컴퍼니)"
              value={newJobClient}
              onChangeText={setNewJobClient}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={() => {
                  setModalVisible(false);
                  Alert.alert("알림", "작업 생성 페이지로 이동해주세요.");
                }}
              >
                <Text style={styles.buttonText}>등록</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// 상태에 따른 스타일 반환 함수
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

// 우선순위에 따른 스타일 반환 함수
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

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: "#F0F2F5",
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  refreshButton: {
    padding: 8,
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
  todayTaskBanner: {
    backgroundColor: "#795FFC", // 보라색 계열
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  bannerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  bannerSubtitle: {
    color: "#E0E0E0",
    fontSize: 14,
    marginTop: 5,
  },
  tabBarContainer: {
    backgroundColor: "#fff",

    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    overflow: "hidden",
  },
  tabBar: {
    flexDirection: "row",
    paddingVertical: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    position: "relative",
  },
  tabItemActive: {
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 3,
    borderBottomColor: "#007AFF",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#666",
    marginBottom: 4,
  },
  tabTextActive: {
    color: "#007AFF",
    fontWeight: "600",
  },
  tabBadge: {
    backgroundColor: "#FF5722",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  tabBadgeActive: {
    backgroundColor: "#007AFF",
  },
  tabBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
  tabIndicator: {
    height: 3,
    width: "33.33%",
    position: "absolute",
    bottom: 0,
    left: 0,
  },
  section: {
    padding: 20,
    paddingTop: 0, // 상단 탭과의 간격 조절
  },
  jobCardContainer: {
    marginTop: 15,
    gap: 15,
  },
  jobCard: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 15,
  },
  jobCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#333",
  },
  jobClientContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
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
    overflow: "hidden",
  },
  statusInProgress: {
    backgroundColor: "#E3F2FD", // 연한 파랑
    color: "#2196F3", // 파랑
  },
  statusWaiting: {
    backgroundColor: "#FFF3E0", // 연한 주황
    color: "#FF9800", // 주황
  },
  statusCompleted: {
    backgroundColor: "#E8F5E9", // 연한 초록
    color: "#4CAF50", // 초록
  },
  priorityTag: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 15,
    fontSize: 13,
    fontWeight: "bold",
    overflow: "hidden",
  },
  priorityUrgent: {
    backgroundColor: "#FFEBEE", // 연한 빨강
    color: "#F44336", // 빨강
  },
  priorityNormal: {
    backgroundColor: "#E0F7FA", // 연한 하늘색
    color: "#00BCD4", // 하늘색
  },
  detailsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 15,
  },
  detailTag: {
    backgroundColor: "#EFEFEF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    fontSize: 12,
    color: "#555",
    fontWeight: "500",
  },
  detailTagActive: {
    backgroundColor: "#E8F5E9",
    color: "#4CAF50",
  },
  jobCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailButton: {
    backgroundColor: "#E0E0E0",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  detailButtonText: {
    color: "#555",
    fontWeight: "bold",
    fontSize: 13,
  },
  jobTime: {
    fontSize: 12,
    color: "#999",
  },
  createJobButton: {
    backgroundColor: "#795FFC", // 보라색 계열
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 20, // 하단 탭 바와의 간격
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  createJobButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  bottomTabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  bottomTabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 5,
  },
  bottomTabText: {
    fontSize: 11,
    color: "#555",
    marginTop: 2,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    margin: 20,
    width: "90%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  input: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 10,
    width: "100%",
    marginTop: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#F8F8F8",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 30,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#B0BEC5", // 회색 계열
  },
  submitButton: {
    backgroundColor: "#6A5ACD", // 메인 색상
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 17,
  },
  tabBarMargin: {
    height: 100, // 탭바 높이 + 안전 영역 고려
  },
  timelineContainer: {
    paddingTop: 10,
    marginBottom: 15,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
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
    width: "20%", // 5개씩 배치
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  footerLoaderText: {
    color: "#007AFF",
    fontSize: 14,
    marginTop: 10,
  },
  flatListContainer: {
    paddingBottom: 100, // 탭바 높이 + 안전 영역 고려
    paddingHorizontal: 20, // 좌우 패딩 추가
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    marginTop: 10,
    color: "#999",
    fontSize: 16,
  },
});
