import { useJobStore } from "@/stores/jobStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function TaskDetailScreen() {
  const router = useRouter();
  const { selectedJob, clearSelectedJob } = useJobStore();

  const handleBack = () => {
    clearSelectedJob();
    router.back();
  };

  if (!selectedJob) {
    return (
      <View style={styles.container}>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>선택된 작업이 없습니다.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* 작업 정보 카드 */}
        <View style={styles.jobCard}>
          <View style={styles.jobHeader}>
            <Text style={styles.jobTitle}>{selectedJob.title}</Text>
            <View style={styles.jobClientContainer}>
              <Ionicons name="business-outline" size={16} color="#999" />
              <Text style={styles.clientText}>{selectedJob.client}</Text>
            </View>
          </View>

          <View style={styles.statusAndPriority}>
            <Text style={getPriorityStyle(selectedJob.priority)}>
              {selectedJob.priority}
            </Text>
            <Text style={getStatusStyle(selectedJob.status)}>
              {selectedJob.status}
            </Text>
          </View>
          <View style={styles.dateContainer}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>발주일</Text>
              <Text style={styles.dateValue}>{selectedJob.time}</Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>납품일</Text>
              <Text style={styles.dateValue}>{selectedJob.time2}</Text>
            </View>
          </View>
        </View>

        {/* 타임라인 섹션 */}
        <View style={styles.timelineContainer}>
          <Text style={styles.timelineTitle}>진행 상황</Text>
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.timelineDotActive]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineText}>인쇄</Text>
                <Text
                  style={styles.timelineCompany}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  스노우화이트
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
              <View style={[styles.timelineDot, styles.timelineDotActive]} />
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
              <View style={[styles.timelineDot, styles.timelineDotActive]} />
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
              <View style={styles.timelineDot} />
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
      </ScrollView>
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
  container: {
    flex: 1,
    backgroundColor: "#F0F2F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  content: {
    flex: 1,
    padding: 20,
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
  jobCard: {
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
  jobHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  jobClientContainer: {
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
  timelineContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  timelineTitle: {
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
});
