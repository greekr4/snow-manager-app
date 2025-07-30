import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal, // Modal 컴포넌트를 import 합니다.
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function TaskCreate() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    taskName: "",
    client: "",
    orderDate: new Date(),
    deliveryDate: new Date(),
    deliveryMethod: "",
    description: "",
    originalSize: "",
    individualSize: "",
    paper: "",
    printing: "",
    postProcessing: "",
    priority: "보통",
  });

  const [showOrderDatePicker, setShowOrderDatePicker] = useState(false);
  const [showDeliveryDatePicker, setShowDeliveryDatePicker] = useState(false);

  // iOS DatePicker에서 임시로 날짜를 저장할 state
  const [pickerDate, setPickerDate] = useState(new Date());

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (
    field: "orderDate" | "deliveryDate",
    date: Date
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: date,
    }));
  };

  const handleSubmit = () => {
    // 필수 필드 검증
    if (!formData.taskName.trim()) {
      Alert.alert("오류", "작업명을 입력해주세요.");
      return;
    }
    if (!formData.client.trim()) {
      Alert.alert("오류", "발주처를 입력해주세요.");
      return;
    }

    // 작업 생성 로직 (여기에 실제 저장 로직 추가)
    console.log("생성된 작업 데이터:", formData);
    Alert.alert("성공", "작업이 생성되었습니다.", [
      { text: "확인", onPress: () => router.back() },
    ]);
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}년 ${month}월 ${day}일`;
  };

  // iOS용 DatePicker 열기 핸들러
  const openIosDatePicker = (field: "orderDate" | "deliveryDate") => {
    setPickerDate(formData[field]); // 현재 설정된 날짜로 picker 초기화
    if (field === "orderDate") {
      setShowOrderDatePicker(true);
    } else {
      setShowDeliveryDatePicker(true);
    }
  };

  return (
    <>
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={50}
        showsVerticalScrollIndicator={false}
      >
        {/* 기본 정보 */}
        <View style={styles.Card}>
          <Text style={styles.CardTitle}>기본 정보</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>작업명</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="document-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                value={formData.taskName}
                onChangeText={(value) => handleInputChange("taskName", value)}
                placeholder="명함"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>발주처</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="business-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                value={formData.client}
                onChangeText={(value) => handleInputChange("client", value)}
                placeholder="발주처를 입력하세요"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>발주일</Text>
            <TouchableOpacity
              style={styles.inputWrapper}
              onPress={() =>
                Platform.OS === "ios"
                  ? openIosDatePicker("orderDate")
                  : setShowOrderDatePicker(true)
              }
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <Text style={styles.dateText}>
                {formatDate(formData.orderDate)}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>납품일</Text>
            <TouchableOpacity
              style={styles.inputWrapper}
              onPress={() =>
                Platform.OS === "ios"
                  ? openIosDatePicker("deliveryDate")
                  : setShowDeliveryDatePicker(true)
              }
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <Text style={styles.dateText}>
                {formatDate(formData.deliveryDate)}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>납품방식</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="car-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                value={formData.deliveryMethod}
                onChangeText={(value) =>
                  handleInputChange("deliveryMethod", value)
                }
                placeholder="납품방식을 입력하세요"
              />
            </View>
          </View>
        </View>

        {/* 작업 상세 */}
        <View style={styles.Card}>
          <Text style={styles.CardTitle}>작업 상세</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>작업 설명</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.description}
                onChangeText={(value) =>
                  handleInputChange("description", value)
                }
                placeholder="작업 설명을 입력하세요"
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>원단사이즈</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="resize-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                value={formData.originalSize}
                onChangeText={(value) =>
                  handleInputChange("originalSize", value)
                }
                placeholder="원단사이즈를 입력하세요"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>개별 사이즈</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="resize-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                value={formData.individualSize}
                onChangeText={(value) =>
                  handleInputChange("individualSize", value)
                }
                placeholder="개별 사이즈를 입력하세요"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>용지</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                value={formData.paper}
                onChangeText={(value) => handleInputChange("paper", value)}
                placeholder="용지를 입력하세요"
              />
            </View>
          </View>
        </View>

        {/* 공정 정보 */}
        <View style={styles.Card}>
          <Text style={styles.CardTitle}>공정 정보</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>인쇄</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="print-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                value={formData.printing}
                onChangeText={(value) => handleInputChange("printing", value)}
                placeholder="인쇄 방식을 입력하세요"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>후가공</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="construct-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                value={formData.postProcessing}
                onChangeText={(value) =>
                  handleInputChange("postProcessing", value)
                }
                placeholder="후가공 방식을 입력하세요"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>우선순위</Text>
            <View style={styles.priorityContainer}>
              {["긴급", "보통"].map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityButton,
                    formData.priority === priority &&
                      styles.priorityButtonActive,
                  ]}
                  onPress={() => handleInputChange("priority", priority)}
                >
                  <Text
                    style={[
                      styles.priorityButtonText,
                      formData.priority === priority &&
                        styles.priorityButtonTextActive,
                    ]}
                  >
                    {priority}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* 저장 버튼 */}
        <View style={styles.Card}>
          <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
            <Text style={styles.submitButtonText}>작업 생성</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>

      {/* --- DatePicker 로직 --- */}
      {/* Android DatePicker */}
      {Platform.OS === "android" && showOrderDatePicker && (
        <DateTimePicker
          value={formData.orderDate}
          mode="date"
          display="default"
          locale="ko-KR"
          onChange={(event, selectedDate) => {
            setShowOrderDatePicker(false);
            if (selectedDate) {
              handleDateChange("orderDate", selectedDate);
            }
          }}
        />
      )}
      {Platform.OS === "android" && showDeliveryDatePicker && (
        <DateTimePicker
          value={formData.deliveryDate}
          mode="date"
          display="default"
          locale="ko-KR"
          onChange={(event, selectedDate) => {
            setShowDeliveryDatePicker(false);
            if (selectedDate) {
              handleDateChange("deliveryDate", selectedDate);
            }
          }}
        />
      )}

      {/* iOS Order Date Picker Modal */}
      <Modal
        transparent={true}
        animationType="slide"
        visible={showOrderDatePicker && Platform.OS === "ios"}
        onRequestClose={() => setShowOrderDatePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPressOut={() => setShowOrderDatePicker(false)}
        >
          <View style={styles.iosDatePickerModalView}>
            <View style={styles.iosDatePickerHeader}>
              <TouchableOpacity
                onPress={() => setShowOrderDatePicker(false)}
                style={styles.iosDatePickerButton}
              >
                <Text style={styles.iosDatePickerButtonText}>취소</Text>
              </TouchableOpacity>
              <Text style={styles.iosDatePickerTitle}>발주일 선택</Text>
              <TouchableOpacity
                onPress={() => {
                  handleDateChange("orderDate", pickerDate);
                  setShowOrderDatePicker(false);
                }}
                style={styles.iosDatePickerButton}
              >
                <Text
                  style={[
                    styles.iosDatePickerButtonText,
                    styles.iosDatePickerConfirmText,
                  ]}
                >
                  확인
                </Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={pickerDate}
              mode="date"
              display="spinner"
              locale="ko-KR"
              onChange={(event, selectedDate) =>
                setPickerDate(selectedDate || pickerDate)
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* iOS Delivery Date Picker Modal */}
      <Modal
        transparent={true}
        animationType="slide"
        visible={showDeliveryDatePicker && Platform.OS === "ios"}
        onRequestClose={() => setShowDeliveryDatePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPressOut={() => setShowDeliveryDatePicker(false)}
        >
          <View style={styles.iosDatePickerModalView}>
            <View style={styles.iosDatePickerHeader}>
              <TouchableOpacity
                onPress={() => setShowDeliveryDatePicker(false)}
                style={styles.iosDatePickerButton}
              >
                <Text style={styles.iosDatePickerButtonText}>취소</Text>
              </TouchableOpacity>
              <Text style={styles.iosDatePickerTitle}>납품일 선택</Text>
              <TouchableOpacity
                onPress={() => {
                  handleDateChange("deliveryDate", pickerDate);
                  setShowDeliveryDatePicker(false);
                }}
                style={styles.iosDatePickerButton}
              >
                <Text
                  style={[
                    styles.iosDatePickerButtonText,
                    styles.iosDatePickerConfirmText,
                  ]}
                >
                  확인
                </Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={pickerDate}
              mode="date"
              display="spinner"
              locale="ko-KR"
              onChange={(event, selectedDate) =>
                setPickerDate(selectedDate || pickerDate)
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F2F5",
  },
  content: {
    padding: 20,
    paddingBottom: 40, // 하단 여백 조정
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
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontWeight: "500",
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    backgroundColor: "transparent",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#b6b6b6",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#fff",
    minHeight: 60,
  },
  inputIcon: {
    marginRight: 10,
  },
  dateText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  priorityContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  priorityButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f9f9f9",
  },
  priorityButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  priorityButtonText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  priorityButtonTextActive: {
    color: "#fff",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  // --- iOS DatePicker Modal Styles ---
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  iosDatePickerModalView: {
    backgroundColor: "#F7F7F7", // iOS 시스템 색상과 유사하게
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20, // 하단 여백 추가
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 20,
  },
  iosDatePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  iosDatePickerButton: {
    padding: 5,
  },
  iosDatePickerButtonText: {
    fontSize: 17,
    color: "#007AFF",
  },
  iosDatePickerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
  },
  iosDatePickerConfirmText: {
    fontWeight: "600",
  },
});
