import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text, // ThemedText 대신 기본 Text 사용
  TextInput,
  TouchableOpacity,
  View, // ThemedView 대신 기본 View 사용
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 오늘의 인쇄 작업 목업(mockup) 데이터
const todayJobsData = [
  {
    id: 1,
    title: "브로슈어",
    client: "피앤제이",
    status: "진행중",
    priority: "긴급",
    details: ["인쇄", "톰슨", "귀도리", "코팅"],
    time: "2025-07-28 13:00",
  },
  {
    id: 2,
    title: "명함",
    client: "피앤제이",
    status: "완료",
    priority: "보통",
    details: ["인쇄", "귀도리", "코팅"],
    time: "2025-07-28 12:00",
  },
];

// 빠른 메뉴 아이템 - 하단 탭 메뉴로 변경
const bottomTabItems = [
  { id: "home", title: "홈", icon: "home-outline" },
  { id: "calendar", title: "캘린더", icon: "calendar-outline" },
  { id: "document", title: "문서", icon: "document-outline" },
  { id: "profile", title: "프로필", icon: "person-outline" },
  { id: "settings", title: "설정", icon: "settings-outline" },
];

export default function HomeScreen() {
  const [isModalVisible, setModalVisible] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobClient, setNewJobClient] = useState("");
  const [todayJobs, setTodayJobs] = useState(todayJobsData);
  const [selectedTab, setSelectedTab] = useState("전체"); // 상단 탭 선택 상태

  // useSafeAreaInsets 훅을 사용하여 안전 영역 크기를 가져옴
  const insets = useSafeAreaInsets();

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
      {/* --- 상단 앱 바(App Bar) --- */}
      <View style={[styles.appBar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.appBarLeft}>
          <View style={styles.profileImageContainer}>
            <Ionicons name="person-circle-outline" size={40} color="#fff" />
          </View>
          <View>
            <Text style={styles.profileName}>김태균</Text>
            <Text style={styles.profileRole}>대리</Text>
          </View>
          <Ionicons
            name="checkmark-circle"
            size={16}
            color="#00C853"
            style={{ marginLeft: 5 }}
          />
        </View>
        <View style={styles.appBarRight}>
          <TouchableOpacity
            onPress={() => Alert.alert("알림", "채팅은 준비 중입니다.")}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Alert.alert("알림", "알림은 준비 중입니다.")}
          >
            <Ionicons name="notifications-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container}>
        {/* --- 오늘의 작업 섹션 (상단 배너) --- */}
        <View style={styles.todayTaskBanner}>
          <View>
            <Text style={styles.bannerTitle}>오늘의 작업</Text>
            <Text style={styles.bannerSubtitle}>
              Today task & presence activity
            </Text>
          </View>
          <Ionicons name="camera-outline" size={60} color="#fff" />{" "}
          {/* 카메라 아이콘 예시 */}
        </View>

        {/* --- 상단 탭 메뉴 --- */}
        <View style={styles.topTabContainer}>
          {["전체", "진행중", "완료"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.topTab,
                selectedTab === tab && styles.topTabSelected,
              ]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text
                style={[
                  styles.topTabText,
                  selectedTab === tab && styles.topTabTextSelected,
                ]}
              >
                {tab}
                {tab === "진행중" && <Text style={styles.tabCount}> 2</Text>}
                {tab === "완료" && <Text style={styles.tabCount}> 2</Text>}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* --- 오늘의 작업 목록 --- */}
        <View style={styles.section}>
          <View style={styles.jobCardContainer}>
            {filteredJobs.map((job) => (
              <View key={job.id} style={styles.jobCard}>
                <View style={styles.jobCardHeader}>
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  <View style={styles.jobClientContainer}>
                    <Ionicons
                      name="document-text-outline"
                      size={16}
                      color="#999"
                    />
                    <Text style={styles.clientText}>{job.client}</Text>
                  </View>
                </View>
                <View style={styles.statusAndPriority}>
                  <Text style={getStatusStyle(job.status)}>{job.status}</Text>
                  <Text style={getPriorityStyle(job.priority)}>
                    {job.priority}
                  </Text>
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
                <View style={styles.jobCardFooter}>
                  <TouchableOpacity style={styles.detailButton}>
                    <Text style={styles.detailButtonText}>상세보기</Text>
                  </TouchableOpacity>
                  <Text style={styles.jobTime}>{job.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* --- 작업 생성하기 버튼 --- */}
        <TouchableOpacity
          style={styles.createJobButton}
          onPress={() => handleMenuPress("new_job")}
        >
          <Text style={styles.createJobButtonText}>작업 생성하기</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* --- 하단 탭 바 --- */}
      <View style={[styles.bottomTabBar, { paddingBottom: insets.bottom }]}>
        {bottomTabItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.bottomTabItem}
            onPress={() =>
              Alert.alert("알림", `${item.title} 메뉴는 준비 중입니다.`)
            }
          >
            <Ionicons name={item.icon as any} size={24} color="#555" />
            <Text style={styles.bottomTabText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

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
    backgroundColor: "#F0F2F5", // 전체 배경색
  },
  appBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: "#6A5ACD", // 이미지에 가까운 보라색 계열
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  appBarLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImageContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#8A2BE2", // 프로필 이미지 배경색
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  profileRole: {
    color: "#E0E0E0",
    fontSize: 13,
  },
  appBarRight: {
    flexDirection: "row",
    gap: 15,
  },
  container: {
    flex: 1,
  },
  todayTaskBanner: {
    backgroundColor: "#8A2BE2", // 보라색 계열
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "space-between",
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
  },
  bannerSubtitle: {
    color: "#E0E0E0",
    fontSize: 14,
    marginTop: 5,
  },
  topTabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 10,
    paddingVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  topTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  topTabSelected: {
    backgroundColor: "#6A5ACD", // 선택된 탭 배경색
  },
  topTabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#555",
  },
  topTabTextSelected: {
    color: "#fff",
  },
  tabCount: {
    backgroundColor: "#FF5722", // 주황색 카운트 배경
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 5,
    overflow: "hidden", // 텍스트가 넘치지 않도록
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
    marginBottom: 10,
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
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 10,
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
    backgroundColor: "#6A5ACD", // 보라색 계열
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
});
