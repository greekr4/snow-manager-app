import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal, // Modal 컴포넌트를 import 합니다.
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function TaskCreate() {
  const router = useRouter();
  const screenHeight = Dimensions.get("window").height;

  // 애니메이션 값들
  const slideAnimDelivery = useRef(new Animated.Value(screenHeight)).current;
  const slideAnimPrinting = useRef(new Animated.Value(screenHeight)).current;
  const slideAnimPostProcessing = useRef(
    new Animated.Value(screenHeight)
  ).current;

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
    postProcessing: {} as Record<string, string[]>,
    priority: "보통",
  });

  const [showOrderDatePicker, setShowOrderDatePicker] = useState(false);
  const [showDeliveryDatePicker, setShowDeliveryDatePicker] = useState(false);
  const [showDeliveryMethodModal, setShowDeliveryMethodModal] = useState(false);
  const [showPrintingMethodModal, setShowPrintingMethodModal] = useState(false);
  const [showPostProcessingModal, setShowPostProcessingModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [
    expandedPostProcessingCategories,
    setExpandedPostProcessingCategories,
  ] = useState<string[]>([]);
  const [expandedDeliveryCategories, setExpandedDeliveryCategories] = useState<
    string[]
  >(["납품방식"]);

  // iOS DatePicker에서 임시로 날짜를 저장할 state
  const [pickerDate, setPickerDate] = useState(new Date());

  // 납품방식 옵션
  const deliveryMethodOptions = {
    납품방식: ["택배", "퀵", "자가", "방문수령", "기타"],
  };

  // 인쇄방식 옵션
  const printingMethodOptions = {
    디지털인쇄: ["내부인쇄", "태산인디고", "기타"],
    옵셋인쇄: ["동양인쇄", "114 프린팅", "기타"],
  };

  // 후가공 옵션
  const postProcessingOptions = {
    코팅: ["자체코팅", "외부코팅", "기타"],
    박: ["자체박", "외부박", "기타"],
    목형: ["자체목형", "외부목형", "V컷", "기타"],
    목형2: ["자체목형", "외부목형", "V컷", "기타"],
    목형3: ["자체목형", "외부목형", "V컷", "기타"],
  };

  // 모달 열기/닫기 애니메이션 함수들
  const handleOpenDeliveryModal = () => {
    setShowDeliveryMethodModal(true);
    Animated.timing(slideAnimDelivery, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleCloseDeliveryModal = () => {
    Animated.timing(slideAnimDelivery, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowDeliveryMethodModal(false);
    });
  };

  const handleOpenPrintingModal = () => {
    setShowPrintingMethodModal(true);
    Animated.timing(slideAnimPrinting, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleClosePrintingModal = () => {
    Animated.timing(slideAnimPrinting, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowPrintingMethodModal(false);
    });
  };

  const handleOpenPostProcessingModal = () => {
    setShowPostProcessingModal(true);
    Animated.timing(slideAnimPostProcessing, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleClosePostProcessingModal = () => {
    Animated.timing(slideAnimPostProcessing, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowPostProcessingModal(false);
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePostProcessingChange = (category: string, option: string) => {
    setFormData((prev) => {
      const currentPostProcessing = prev.postProcessing as Record<
        string,
        string[]
      >;
      const currentCategory = currentPostProcessing[category] || [];

      let newCategory: string[];
      if (currentCategory.includes(option)) {
        // 이미 선택된 경우 제거
        newCategory = [];
      } else {
        // 선택되지 않은 경우 해당 카테고리에서 1개만 선택
        newCategory = [option];
      }

      return {
        ...prev,
        postProcessing: {
          ...currentPostProcessing,
          [category]: newCategory,
        } as Record<string, string[]>,
      };
    });
  };

  const getSelectedPostProcessingText = () => {
    const postProcessing = formData.postProcessing as Record<string, string[]>;
    const selectedItems = Object.entries(postProcessing)
      .filter(([category, items]) => items && items.length > 0)
      .map(([category, items]) => `[${category}] ${items[0]}`);

    return selectedItems.length > 0
      ? selectedItems.join(", ")
      : "후가공을 선택하세요";
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
        resetScrollToCoords={undefined}
        enableResetScrollToCoords={false}
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
            <TouchableOpacity
              style={styles.inputWrapper}
              onPress={handleOpenDeliveryModal}
            >
              <Ionicons
                name="car-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <Text
                style={[
                  styles.textInput,
                  !formData.deliveryMethod && styles.placeholderText,
                ]}
              >
                {formData.deliveryMethod || "납품방식을 선택하세요"}
              </Text>
              <Ionicons name="chevron-down-outline" size={20} color="#666" />
            </TouchableOpacity>
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
            <TouchableOpacity
              style={styles.inputWrapper}
              onPress={handleOpenPrintingModal}
            >
              <Ionicons
                name="print-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <Text
                style={[
                  styles.textInput,
                  !formData.printing && styles.placeholderText,
                ]}
              >
                {formData.printing || "인쇄 방식을 선택하세요"}
              </Text>
              <Ionicons name="chevron-down-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>후가공</Text>
            <TouchableOpacity
              style={styles.inputWrapper}
              onPress={handleOpenPostProcessingModal}
            >
              <Ionicons
                name="construct-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <Text
                style={[
                  styles.textInput,
                  !getSelectedPostProcessingText().includes("선택하세요") &&
                    styles.placeholderText,
                ]}
              >
                {getSelectedPostProcessingText()}
              </Text>
              <Ionicons name="chevron-down-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>우선순위</Text>
            <View style={styles.priorityContainer}>
              {["보통", "중요", "긴급"].map((priority) => (
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
          onPress={() => setShowOrderDatePicker(false)}
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
          onPress={() => setShowDeliveryDatePicker(false)}
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

      {/* 납품방식 선택 Modal */}
      <Modal
        visible={showDeliveryMethodModal}
        transparent={true}
        animationType="none"
        onRequestClose={handleCloseDeliveryModal}
      >
        <TouchableWithoutFeedback onPress={handleCloseDeliveryModal}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <Animated.View
                style={[
                  styles.optionPickerModalView,
                  {
                    transform: [{ translateY: slideAnimDelivery }],
                  },
                ]}
              >
                <View style={styles.handle} />
                <View style={styles.optionPickerHeader}>
                  <Text style={styles.optionPickerTitle}>납품방식</Text>
                </View>
                <View style={styles.optionPickerContent}>
                  <KeyboardAwareScrollView
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={styles.scrollContent}
                    nestedScrollEnabled={true}
                    style={{ flex: 1 }}
                  >
                    {Object.entries(deliveryMethodOptions).map(
                      ([category, options]) => {
                        const isExpanded =
                          expandedDeliveryCategories.includes(category);
                        return (
                          <View
                            key={category}
                            style={[
                              styles.categorySection,
                              isExpanded && {
                                borderBottomLeftRadius: 0,
                                borderBottomRightRadius: 0,
                              },
                            ]}
                          >
                            <TouchableOpacity
                              style={styles.categoryHeader}
                              onPress={() => {
                                if (isExpanded) {
                                  setExpandedDeliveryCategories(
                                    expandedDeliveryCategories.filter(
                                      (cat) => cat !== category
                                    )
                                  );
                                } else {
                                  setExpandedDeliveryCategories([
                                    ...expandedDeliveryCategories,
                                    category,
                                  ]);
                                }
                              }}
                            >
                              <Text style={styles.categoryTitle}>
                                {category}
                              </Text>
                              <Ionicons
                                name={
                                  isExpanded ? "chevron-up" : "chevron-down"
                                }
                                size={20}
                                color="#666"
                              />
                            </TouchableOpacity>
                            {isExpanded && (
                              <View style={styles.categoryOptions}>
                                {options.map((option) => (
                                  <TouchableOpacity
                                    key={option}
                                    style={styles.optionItem}
                                    onPress={() => {
                                      handleInputChange(
                                        "deliveryMethod",
                                        option
                                      );
                                    }}
                                  >
                                    <Text style={styles.optionItemText}>
                                      {option}
                                    </Text>
                                    {formData.deliveryMethod === option && (
                                      <Ionicons
                                        name="checkmark"
                                        size={16}
                                        color="#007AFF"
                                      />
                                    )}
                                  </TouchableOpacity>
                                ))}
                              </View>
                            )}
                          </View>
                        );
                      }
                    )}
                  </KeyboardAwareScrollView>
                </View>
                {/* 확인 버튼 */}
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={styles.modalConfirmButton}
                    onPress={handleCloseDeliveryModal}
                  >
                    <Text style={styles.modalConfirmButtonText}>확인</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 인쇄방식 선택 Modal */}
      <Modal
        transparent={true}
        animationType="none"
        visible={showPrintingMethodModal}
        onRequestClose={handleClosePrintingModal}
      >
        <TouchableWithoutFeedback onPress={handleClosePrintingModal}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <Animated.View
                style={[
                  styles.optionPickerModalView,
                  {
                    transform: [{ translateY: slideAnimPrinting }],
                  },
                ]}
              >
                <View style={styles.handle} />
                <View style={styles.optionPickerHeader}>
                  <Text style={styles.optionPickerTitle}>인쇄방식</Text>
                </View>
                <View style={styles.optionPickerContent}>
                  <KeyboardAwareScrollView
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={styles.scrollContent}
                    nestedScrollEnabled={true}
                    style={{ flex: 1 }}
                  >
                    {Object.entries(printingMethodOptions).map(
                      ([category, options]) => {
                        const isExpanded =
                          expandedCategories.includes(category);
                        return (
                          <View
                            key={category}
                            style={[
                              styles.categorySection,
                              isExpanded && {
                                borderBottomLeftRadius: 0,
                                borderBottomRightRadius: 0,
                              },
                            ]}
                          >
                            <TouchableOpacity
                              style={styles.categoryHeader}
                              onPress={() => {
                                if (isExpanded) {
                                  setExpandedCategories(
                                    expandedCategories.filter(
                                      (cat) => cat !== category
                                    )
                                  );
                                } else {
                                  setExpandedCategories([
                                    ...expandedCategories,
                                    category,
                                  ]);
                                }
                              }}
                            >
                              <Text style={styles.categoryTitle}>
                                {category}
                              </Text>
                              <Ionicons
                                name={
                                  isExpanded ? "chevron-up" : "chevron-down"
                                }
                                size={20}
                                color="#666"
                              />
                            </TouchableOpacity>
                            {isExpanded && (
                              <View style={styles.categoryOptions}>
                                {options.map((option) => (
                                  <TouchableOpacity
                                    key={option}
                                    style={styles.optionItem}
                                    onPress={() => {
                                      handleInputChange("printing", option);
                                    }}
                                  >
                                    <Text style={styles.optionItemText}>
                                      {option}
                                    </Text>
                                    {formData.printing === option && (
                                      <Ionicons
                                        name="checkmark"
                                        size={16}
                                        color="#007AFF"
                                      />
                                    )}
                                  </TouchableOpacity>
                                ))}
                              </View>
                            )}
                          </View>
                        );
                      }
                    )}
                  </KeyboardAwareScrollView>
                </View>
                {/* 확인 버튼 */}
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={styles.modalConfirmButton}
                    onPress={handleClosePrintingModal}
                  >
                    <Text style={styles.modalConfirmButtonText}>확인</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 후가공 선택 Modal */}
      <Modal
        transparent={true}
        animationType="none"
        visible={showPostProcessingModal}
        onRequestClose={handleClosePostProcessingModal}
      >
        <TouchableWithoutFeedback onPress={handleClosePostProcessingModal}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <Animated.View
                style={[
                  styles.optionPickerModalView,
                  {
                    transform: [{ translateY: slideAnimPostProcessing }],
                  },
                ]}
              >
                <View style={styles.handle} />
                <View style={styles.optionPickerHeader}>
                  <Text style={styles.optionPickerTitle}>후가공</Text>
                </View>
                <View style={styles.optionPickerContent}>
                  <KeyboardAwareScrollView
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={styles.scrollContent}
                    nestedScrollEnabled={true}
                    style={{ flex: 1 }}
                  >
                    {Object.entries(postProcessingOptions).map(
                      ([category, options]) => {
                        const isExpanded =
                          expandedPostProcessingCategories.includes(category);
                        const selectedItems =
                          (formData.postProcessing as Record<string, string[]>)[
                            category
                          ] || [];
                        const selectedText =
                          selectedItems.length > 0 ? `${selectedItems[0]}` : "";

                        return (
                          <View
                            key={category}
                            style={[
                              styles.categorySection,
                              isExpanded && {
                                borderBottomLeftRadius: 0,
                                borderBottomRightRadius: 0,
                              },
                            ]}
                          >
                            <TouchableOpacity
                              style={styles.categoryHeader}
                              onPress={() => {
                                if (isExpanded) {
                                  setExpandedPostProcessingCategories(
                                    expandedPostProcessingCategories.filter(
                                      (cat) => cat !== category
                                    )
                                  );
                                } else {
                                  setExpandedPostProcessingCategories([
                                    ...expandedPostProcessingCategories,
                                    category,
                                  ]);
                                }
                              }}
                            >
                              <View style={styles.categoryTitleContainer}>
                                <Text style={styles.categoryTitle}>
                                  {category}
                                </Text>
                                {selectedItems.length > 0 && (
                                  <Text style={styles.selectedItemsText}>
                                    {selectedText}
                                  </Text>
                                )}
                              </View>
                              <Ionicons
                                name={
                                  isExpanded ? "chevron-up" : "chevron-down"
                                }
                                size={20}
                                color="#666"
                              />
                            </TouchableOpacity>
                            {isExpanded && (
                              <View style={styles.categoryOptions}>
                                {options.map((option) => (
                                  <TouchableOpacity
                                    key={option}
                                    style={styles.optionItem}
                                    onPress={() => {
                                      handlePostProcessingChange(
                                        category,
                                        option
                                      );
                                    }}
                                  >
                                    <Text style={styles.optionItemText}>
                                      {option}
                                    </Text>
                                    {selectedItems.includes(option) && (
                                      <Ionicons
                                        name="checkmark"
                                        size={16}
                                        color="#007AFF"
                                      />
                                    )}
                                  </TouchableOpacity>
                                ))}
                              </View>
                            )}
                          </View>
                        );
                      }
                    )}
                  </KeyboardAwareScrollView>
                </View>
                {/* 확인 버튼 */}
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={styles.modalConfirmButton}
                    onPress={handleClosePostProcessingModal}
                  >
                    <Text style={styles.modalConfirmButtonText}>확인</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
    paddingBottom: 100,
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
    paddingHorizontal: 35,
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    zIndex: 999,
  },
  iosDatePickerModalView: {
    backgroundColor: "#FFFFFF", // iOS 시스템 색상과 유사하게
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
  placeholderText: {
    color: "#333",
  },
  // --- Option Picker Modal Styles ---
  optionPickerModalView: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 10,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 20,
    zIndex: 1000,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
  },
  optionPickerHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  optionPickerButton: {
    padding: 5,
    minWidth: 50,
  },
  optionPickerButtonText: {
    fontSize: 17,
    color: "#007AFF",
  },
  optionPickerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginVertical: 15,
  },
  optionPickerContent: {
    height: 400,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#D0D0D0",
  },
  optionItemText: {
    fontSize: 16,
    color: "#333",
  },
  categorySection: {
    borderWidth: 1,
    borderColor: "#D0D0D0",
    marginHorizontal: 20,
    marginVertical: 10,
    borderBottomWidth: 0,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#F4F3FF",
    borderBottomWidth: 1,
    borderBottomColor: "#D0D0D0",
  },
  categoryOptions: {
    backgroundColor: "#FFFFFF",
  },
  categoryTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  selectedItemsText: {
    fontSize: 14,
    color: "#007AFF",
    marginRight: 10,
  },
  modalButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    backgroundColor: "#FFFFFF",
  },
  modalConfirmButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollContent: {
    paddingBottom: 20,
  },
});
