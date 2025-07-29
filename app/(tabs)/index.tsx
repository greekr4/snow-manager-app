import { useJobStore } from "@/stores/jobStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// 오늘의 인쇄 작업 목업(mockup) 데이터
const todayJobsData = [
  {
    id: 1,
    title: "브로슈어",
    client: "피앤제이",
    status: "진행중",
    priority: "긴급",
    details: ["인쇄", "톰슨", "귀도리", "코팅"],
    time: "25-07-28 13:00",
    time2: "25-07-29 13:00",
  },
  {
    id: 2,
    title: "명함",
    client: "피앤제이",
    status: "완료",
    priority: "보통",
    details: ["인쇄", "귀도리", "코팅"],
    time: "25-07-28 12:00",
    time2: "25-07-29 12:00",
  },
];

export default function HomeScreen() {
  const [isModalVisible, setModalVisible] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobClient, setNewJobClient] = useState("");
  const [todayJobs, setTodayJobs] = useState(todayJobsData);
  const [selectedTab, setSelectedTab] = useState("전체");

  const router = useRouter();
  const { setSelectedJob } = useJobStore();

  const handleDetailView = (job: any) => {
    setSelectedJob(job);
    router.push("/(tabs)/taskDetail");
  };

  const handleAddJob = () => {
    if (!newJobTitle || !newJobClient) {
      Alert.alert("입력 오류", "작업명과 고객명을 모두 입력해주세요.");
      return;
    }
    const newJob = {
      id: Date.now(),
      title: newJobTitle,
      client: newJobClient,
      status: "대기", // 새 작업은 '대기' 상태로 시작
      priority: "보통", // 기본 우선순위
      details: [], // 초기에는 세부 사항 없음
      time: new Date().toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      time2: new Date().toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    };
    setTodayJobs([newJob, ...todayJobs]);
    setNewJobTitle("");
    setNewJobClient("");
    setModalVisible(false);
  };

  const handleMenuPress = (id: any) => {
    if (id === "new_job") {
      setModalVisible(true);
    } else {
      Alert.alert("알림", `${id} 메뉴는 준비 중입니다.`);
    }
  };

  const filteredJobs = todayJobs.filter((job) => {
    if (selectedTab === "전체") {
      return true;
    } else if (selectedTab === "진행중") {
      return job.status === "진행중";
    } else if (selectedTab === "완료") {
      return job.status === "완료";
    }
    return true;
  });

  return (
    <View style={styles.rootContainer}>
      <ScrollView style={styles.container}>
        {/* --- 작업 생성하기 버튼 --- */}
        {/* <TouchableOpacity
          style={styles.createJobButton}
          onPress={() => handleMenuPress("new_job")}
        >
          <Text style={styles.createJobButtonText}>작업 생성하기</Text>
        </TouchableOpacity> */}

        {/* --- 상단 탭 메뉴 --- */}
        <View style={styles.tabBarContainer}>
          <View style={styles.tabBar}>
            {["전체", "진행중", "완료"].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabItem,
                  selectedTab === tab && styles.tabItemActive,
                ]}
                onPress={() => setSelectedTab(tab)}
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
                  <Text style={styles.tabBadgeText}>2</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.tabIndicator} />
        </View>

        {/* --- 오늘의 작업 목록 --- */}
        <View style={styles.section}>
          <View style={styles.jobCardContainer}>
            {filteredJobs.map((job) => (
              <View key={job.id} style={styles.jobCard}>
                <View style={styles.jobCardHeader}>
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  <View style={styles.jobClientContainer}>
                    <Ionicons name="business-outline" size={16} color="#999" />
                    <Text style={styles.clientText}>{job.client}</Text>
                  </View>
                </View>
                <View style={styles.statusAndPriority}>
                  <Text style={getPriorityStyle(job.priority)}>
                    {job.priority}
                  </Text>
                  <Text style={getStatusStyle(job.status)}>{job.status}</Text>
                </View>
                <View style={styles.detailsContainer}>
                  {job.details.map((detail, index) => (
                    <Text key={index} style={styles.detailTag}>
                      {detail}
                    </Text>
                  ))}
                  {job.details.length > 3 && (
                    <Text style={styles.detailTag}>
                      +{job.details.length - 3}
                    </Text>
                  )}
                </View>

                {/* 타임라인 섹션 */}
                <View style={styles.timelineContainer}>
                  <Text style={styles.timelineTitle}>진행 상황</Text>
                  <View style={styles.timeline}>
                    <View style={styles.timelineItem}>
                      <View
                        style={[styles.timelineDot, styles.timelineDotActive]}
                      />
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineText}>인쇄</Text>
                        <Text
                          style={styles.timelineCompany}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          스노우화이트
                        </Text>
                        <Text style={styles.timelineTime}>07-28</Text>
                      </View>
                    </View>
                    <View style={styles.timelineItem}>
                      <View
                        style={[styles.timelineDot, styles.timelineDotActive]}
                      />
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineText}>코팅</Text>
                        <Text
                          style={styles.timelineCompany}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          우신코팅
                        </Text>
                        <Text
                          style={styles.timelineTime}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          07-28
                        </Text>
                      </View>
                    </View>
                    <View style={styles.timelineItem}>
                      <View
                        style={[styles.timelineDot, styles.timelineDotActive]}
                      />
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineText}>금박</Text>
                        <Text
                          style={styles.timelineCompany}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          신화사금박
                        </Text>
                        <Text
                          style={styles.timelineTime}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          07-29
                        </Text>
                      </View>
                    </View>
                    <View style={styles.timelineItem}>
                      <View style={[styles.timelineDot]} />
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineText}>출고</Text>
                        <Text
                          style={styles.timelineCompany}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          CJ대한통운
                        </Text>
                        <Text
                          style={styles.timelineTime}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          07-29
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.jobCardFooter}>
                  <View>
                    <Text style={styles.jobTime}>발주일: {job.time}</Text>
                    <Text style={styles.jobTime}>납품일: {job.time2}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.detailButton}
                    onPress={() => handleDetailView(job)}
                  >
                    <Text style={styles.detailButtonText}>상세보기</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 탭바 높이만큼 하단 마진 */}
        <View style={styles.tabBarMargin} />
      </ScrollView>

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
                onPress={handleAddJob}
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
const getStatusStyle = (status: any) => {
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
const getPriorityStyle = (priority: any) => {
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
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 10,
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
    marginTop: 15,
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
});
