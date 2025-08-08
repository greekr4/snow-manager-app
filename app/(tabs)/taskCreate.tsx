import { usePushStore } from "@/stores/pushStore";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
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
import { PanGestureHandler } from "react-native-gesture-handler";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Reanimated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

// 옵션 데이터 타입 정의
interface OptionCompany {
  COMPANY_KEY: string;
  OPTION_KEY: string;
  COMPANY_NAME: string;
  COMPANY_TEL: string | null;
  CREATED_AT: string;
  UPDATED_AT: string;
}

interface OptionDetail {
  DETAIL_KEY: string;
  OPTION_KEY: string;
  DETAIL_NAME: string;
  CREATED_AT: string;
  UPDATED_AT: string;
}

interface OptionData {
  OPTION_KEY: string;
  OPTION_CATEGORY: string;
  OPTION_TITLE: string;
  CREATED_AT: string;
  UPDATED_AT: string;
  tb_task_option_company: OptionCompany[];
  tb_task_option_detail: OptionDetail[];
}

// 옵션 데이터 가져오기 API
const fetchOptions = async (): Promise<OptionData[]> => {
  const response = await axios.get("http://210.114.18.110:3333/options");
  return response.data;
};

// 작업 생성 API
interface CreateTaskDto {
  adminKey: string;
  taskTitle: string;
  taskCompany: string;
  taskPriority: string;
  taskProgressing: string;
  taskOrderDate: Date;
  taskDeliveryDate: Date;
  taskDetail: any;
}

const createTask = async (createTaskDto: CreateTaskDto) => {
  const response = await axios.post(
    "http://210.114.18.110:3333/tasks",
    createTaskDto
  );
  return response.data;
};

export default function TaskCreate() {
  const router = useRouter();
  const screenHeight = Dimensions.get("window").height;
  const { sendNotification } = usePushStore();

  // 옵션 데이터 가져오기
  const { data: optionsData, isLoading: optionsLoading } = useQuery({
    queryKey: ["options"],
    queryFn: fetchOptions,
    staleTime: 1000 * 60 * 10, // 10분 캐시
    refetchOnWindowFocus: false,
  });

  // 작업 생성 mutation
  const queryClient = useQueryClient();
  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: (data) => {
      // 작업 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-count"] });
      Alert.alert("성공", "작업이 생성되었습니다.", [
        { text: "확인", onPress: () => router.back() },
      ]);
      sendNotification("작업 등록", `[${data.TASK_TITLE}] 등록`, data.TASK_KEY);
    },
    onError: (error) => {
      console.error("작업 생성 실패:", error);
      Alert.alert("오류", "작업 생성에 실패했습니다. 다시 시도해주세요.");
    },
  });

  // 인쇄 옵션을 DB 데이터로 동적 생성
  const printingMethodOptions = React.useMemo(() => {
    if (!optionsData) return [];

    return optionsData
      .filter((option) => option.OPTION_CATEGORY === "인쇄")
      .map((option) => ({
        category: option.OPTION_TITLE,
        type: option.tb_task_option_detail.map((detail) => detail.DETAIL_NAME),
        options: option.tb_task_option_company.map(
          (company) => company.COMPANY_NAME
        ),
        optionKey: option.OPTION_KEY,
      }));
  }, [optionsData]);

  // 후가공 옵션을 DB 데이터로 동적 생성
  const postProcessingOptions = React.useMemo(() => {
    if (!optionsData) return [];

    return optionsData
      .filter((option) => option.OPTION_CATEGORY === "후가공")
      .map((option) => ({
        category: option.OPTION_TITLE,
        type: option.tb_task_option_detail.map((detail) => detail.DETAIL_NAME),
        options: option.tb_task_option_company.map(
          (company) => company.COMPANY_NAME
        ),
        optionKey: option.OPTION_KEY,
      }));
  }, [optionsData]);

  // 애니메이션 값들
  const slideAnimDelivery = useRef(new Animated.Value(screenHeight)).current;
  const slideAnimPrinting = useRef(new Animated.Value(screenHeight)).current;
  const slideAnimPostProcessing = useRef(
    new Animated.Value(screenHeight)
  ).current;

  const [formData, setFormData] = useState({
    task_title: "",
    task_company: "",
    task_order_date: new Date(),
    task_delivery_date: new Date(),
    delivery_type: "",
    task_desc: "",
    paper_size: "",
    product_size: "",
    paper_type: "",
    printing: "",
    task_priority: "보통",
  });

  // 공정 순서 관리를 위한 state (샘플 데이터 형식에 맞춤)
  const [processOrder, setProcessOrder] = useState<
    Array<{
      id: string;
      process_category: string;
      process_type: string;
      process_company: string;
      process_company_tel: string;
      process_status: "완료" | "진행중" | "미완료";
      process_memo: string;
      order: number;
    }>
  >([]);

  const [showOrderDatePicker, setShowOrderDatePicker] = useState(false);
  const [showDeliveryDatePicker, setShowDeliveryDatePicker] = useState(false);
  const [showDeliveryMethodModal, setShowDeliveryMethodModal] = useState(false);
  const [showPrintingMethodModal, setShowPrintingMethodModal] = useState(false);
  const [showPostProcessingModal, setShowPostProcessingModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [expandedDeliveryCategories, setExpandedDeliveryCategories] = useState<
    string[]
  >(["납품방식"]);

  // iOS DatePicker에서 임시로 날짜를 저장할 state
  const [pickerDate, setPickerDate] = useState(new Date());

  // 납품방식 옵션
  const deliveryMethodOptions = [
    {
      category: "납품방식",
      options: ["택배", "퀵", "자가", "방문수령", "기타"],
    },
  ];

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

  const handleInputChange = (
    field: string,
    value: string,
    type?: string,
    category?: string
  ) => {
    // 인쇄 선택 시 토글로 취소되도록 수정
    if (field === "printing") {
      if (formData.printing === value) {
        // 같은 값이 선택된 경우 취소
        setFormData((prev) => ({
          ...prev,
          [field]: "",
        }));
        // 인쇄 선택 해제 시 제거
        setProcessOrder((prevOrder) =>
          prevOrder.filter((item) => item.process_category !== "인쇄")
        );
        return;
      } else {
        // 다른 값이 선택된 경우 변경
        setFormData((prev) => ({
          ...prev,
          [field]: value,
        }));
      }
    } else {
      // 다른 필드는 기존 로직 유지
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    // 인쇄 선택 시 순서 목록에 추가
    if (field === "printing" && value && type && category) {
      setProcessOrder((prevOrder) => {
        // 기존 인쇄 항목 제거
        const filteredOrder = prevOrder.filter(
          (item) => item.process_category !== "인쇄"
        );

        // DB에서 해당 회사의 전화번호 찾기
        let companyTel = ""; // 기본값을 빈 문자열로 변경
        if (optionsData) {
          const option = optionsData.find(
            (opt) => opt.OPTION_TITLE === category
          );
          if (option) {
            const company = option.tb_task_option_company.find(
              (comp) => comp.COMPANY_NAME === value
            );
            if (company && company.COMPANY_TEL) {
              companyTel = company.COMPANY_TEL;
            }
          }
        }

        // 새로운 인쇄 항목 추가
        return [
          ...filteredOrder,
          {
            id: `printing-${value}-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            process_category: "인쇄",
            process_type: `${category}(${type})`,
            process_company: value,
            process_company_tel: companyTel,
            process_status: "미완료" as const,
            process_memo: "",
            order: filteredOrder.length,
          },
        ];
      });
    }
  };

  const handlePostProcessingChange = (
    category: string,
    type: string,
    option: string
  ) => {
    setProcessOrder((prevOrder) => {
      const existingItem = prevOrder.find(
        (item) =>
          item.process_category === category &&
          item.process_type === type &&
          item.process_company === option
      );

      if (existingItem) {
        // 이미 선택된 경우 제거
        return prevOrder.filter(
          (item) =>
            !(
              item.process_category === category &&
              item.process_type === type &&
              item.process_company === option
            )
        );
      } else {
        // 같은 카테고리의 모든 기존 항목들 제거 (1가지만 선택 가능)
        const filteredOrder = prevOrder.filter(
          (item) => item.process_category !== category
        );

        // DB에서 해당 회사의 전화번호 찾기
        let companyTel = ""; // 기본값을 빈 문자열로 변경
        if (optionsData) {
          const optionData = optionsData.find(
            (opt) => opt.OPTION_TITLE === category
          );
          if (optionData) {
            const company = optionData.tb_task_option_company.find(
              (comp) => comp.COMPANY_NAME === option
            );
            if (company && company.COMPANY_TEL) {
              companyTel = company.COMPANY_TEL;
            }
          }
        }

        // 새로운 항목 추가
        return [
          ...filteredOrder,
          {
            id: `${category}-${type}-${option}-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            process_category: category,
            process_type: type,
            process_company: option,
            process_company_tel: companyTel,
            process_status: "미완료" as const,
            process_memo: "",
            order: filteredOrder.length,
          },
        ];
      }
    });
  };

  const getSelectedPostProcessingText = () => {
    const selectedItems = processOrder
      .filter((item) => item.process_category !== "인쇄")
      .map((item) => `${item.process_category} [${item.process_company}]`);

    return selectedItems.length > 0
      ? selectedItems.join(", ")
      : "후가공을 선택하세요";
  };

  // 드래그 가능한 공정 순서 조절 컴포넌트
  const DraggableProcessItem = ({
    item,
    index,
    onReorder,
  }: {
    item: {
      id: string;
      process_category: string;
      process_type: string;
      process_company: string;
      process_company_tel: string;
      process_status: "완료" | "진행중" | "미완료";
      process_memo: string;
      order: number;
    };
    index: number;
    onReorder: (fromIndex: number, toIndex: number) => void;
  }) => {
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);

    const gestureHandler = useAnimatedGestureHandler({
      onStart: () => {
        scale.value = withSpring(1.05);
      },
      onActive: (event) => {
        translateY.value = event.translationY;
      },
      onEnd: () => {
        scale.value = withSpring(1);
        const newIndex = Math.round(translateY.value / 80) + index;
        if (
          newIndex !== index &&
          newIndex >= 0 &&
          newIndex < processOrder.length
        ) {
          runOnJS(onReorder)(index, newIndex);
        }
        translateY.value = withSpring(0);
      },
    });

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ translateY: translateY.value }, { scale: scale.value }],
        zIndex: scale.value === 1.05 ? 1000 : 1,
      };
    });

    // 공정 타입에 따른 아이콘과 색상
    const getProcessIcon = () => {
      if (item.process_category === "인쇄") {
        return { name: "print-outline", color: "#007AFF" };
      } else {
        return { name: "construct-outline", color: "#34C759" };
      }
    };

    const icon = getProcessIcon();

    return (
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Reanimated.View style={[styles.draggableItem, animatedStyle]}>
          <View style={styles.draggableItemContent}>
            <View style={styles.dragHandle}>
              <Ionicons name="menu" size={20} color="#666" />
            </View>
            <View style={styles.processIcon}>
              <Ionicons name={icon.name as any} size={20} color={icon.color} />
            </View>
            <View style={styles.draggableItemInfo}>
              <Text style={styles.draggableItemCategory}>
                [{item.process_category}]
              </Text>
              <Text style={styles.draggableItemOption}>
                {item.process_type} - {item.process_company}
              </Text>
            </View>
            <View style={styles.orderNumber}>
              <Text style={styles.orderNumberText}>{index + 1}</Text>
            </View>
          </View>
        </Reanimated.View>
      </PanGestureHandler>
    );
  };

  // 순서 재정렬 함수
  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newOrder = [...processOrder];
    const [movedItem] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedItem);

    // order 값 업데이트
    const updatedOrder = newOrder.map((item, index) => ({
      ...item,
      order: index,
    }));

    setProcessOrder(updatedOrder);
  };

  const handleDateChange = (
    field: "task_order_date" | "task_delivery_date",
    date: Date
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: date,
    }));
  };

  const handleSubmit = () => {
    // 필수 필드 검증
    if (!formData.task_title.trim()) {
      Alert.alert("오류", "작업명을 입력해주세요.");
      return;
    }
    if (!formData.task_company.trim()) {
      Alert.alert("오류", "발주처를 입력해주세요.");
      return;
    }

    // DB 형식에 맞춘 최종 데이터
    const finalData: CreateTaskDto = {
      adminKey: "tk", // 실제로는 로그인된 사용자의 adminKey 사용
      taskTitle: formData.task_title,
      taskCompany: formData.task_company,
      taskPriority: formData.task_priority,
      taskProgressing: "진행중",
      taskOrderDate: new Date(formData.task_order_date),
      taskDeliveryDate: new Date(formData.task_delivery_date),
      taskDetail: {
        delivery_type: formData.delivery_type,
        task_desc: formData.task_desc,
        paper_size: formData.paper_size,
        product_size: formData.product_size,
        paper_type: formData.paper_type,
        process: processOrder.map((item, index) => ({
          process_category: item.process_category,
          process_type: item.process_type,
          process_company: item.process_company,
          process_company_tel: item.process_company_tel,
          process_status: item.process_status,
          process_memo: item.process_memo,
        })),
      },
    };

    console.log("finalData", finalData);

    // API 호출
    createTaskMutation.mutate(finalData);
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}년 ${month}월 ${day}일`;
  };

  const formatDateForDB = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // iOS용 DatePicker 열기 핸들러
  const openIosDatePicker = (
    field: "task_order_date" | "task_delivery_date"
  ) => {
    setPickerDate(formData[field]); // 현재 설정된 날짜로 picker 초기화
    if (field === "task_order_date") {
      setShowOrderDatePicker(true);
    } else {
      setShowDeliveryDatePicker(true);
    }
  };

  // 후가공 아코디언 컴포넌트
  const PostProcessingAccordion = ({
    item,
    processOrder,
    onPostProcessingChange,
  }: {
    item: {
      category: string;
      type: string[];
      options: string[];
      optionKey: string;
    };
    processOrder: Array<{
      id: string;
      process_category: string;
      process_type: string;
      process_company: string;
      process_company_tel: string;
      process_status: "완료" | "진행중" | "미완료";
      process_memo: string;
      order: number;
    }>;
    onPostProcessingChange: (
      category: string,
      type: string,
      option: string
    ) => void;
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedType, setSelectedType] = useState("");

    const { category, type, options } = item;
    const selectedItems = processOrder
      .filter((item) => item.process_category === category)
      .map((item) => `${item.process_type} - ${item.process_company}`);
    const selectedText = selectedItems.length > 0 ? `${selectedItems[0]}` : "";

    return (
      <View
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
            setIsExpanded(!isExpanded);
            if (!isExpanded) {
              setSelectedType("");
            }
          }}
        >
          <View style={styles.categoryTitleContainer}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {selectedItems.length > 0 && (
              <Text style={styles.selectedItemsText}>{selectedText}</Text>
            )}
          </View>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#666"
          />
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.categoryOptions}>
            {/* 타입 선택 */}
            <View style={styles.typeSelectionSection}>
              <View style={styles.typeButtonsContainer}>
                {type.map((typeItem) => (
                  <TouchableOpacity
                    key={typeItem}
                    style={[
                      styles.typeButton,
                      selectedType === typeItem && styles.typeButtonActive,
                    ]}
                    onPress={() => setSelectedType(typeItem)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        selectedType === typeItem &&
                          styles.typeButtonTextActive,
                      ]}
                    >
                      {typeItem}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 회사 선택 (타입 선택 후에만 표시) */}
            {selectedType && (
              <View style={styles.companySelectionSection}>
                {options.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.optionItem}
                    onPress={() => {
                      onPostProcessingChange(category, selectedType, option);
                    }}
                  >
                    <Text style={styles.optionItemText}>{option}</Text>
                    {selectedItems.includes(`${selectedType} - ${option}`) && (
                      <Ionicons name="checkmark" size={16} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  // 인쇄방식 아코디언 컴포넌트
  const PrintingAccordion = ({
    item,
    formData,
    onInputChange,
  }: {
    item: {
      category: string;
      type: string[];
      options: string[];
      optionKey: string;
    };
    formData: any;
    onInputChange: (
      field: string,
      value: string,
      type?: string,
      category?: string
    ) => void;
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedType, setSelectedType] = useState("");

    const { category, type, options } = item;

    // 선택된 인쇄 항목 찾기
    const selectedPrintingItem = processOrder.find(
      (item) =>
        item.process_category === "인쇄" &&
        item.process_type.startsWith(category)
    );
    const selectedText = selectedPrintingItem
      ? `[인쇄] ${selectedPrintingItem.process_type}`
      : "";

    return (
      <View
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
            setIsExpanded(!isExpanded);
            console.log(processOrder);

            if (!isExpanded) {
              setSelectedType("");
            }
          }}
        >
          <View style={styles.categoryTitleContainer}>
            <Text style={styles.categoryTitle}>{category} </Text>
            {selectedPrintingItem && (
              <Text style={styles.selectedItemsText}>
                {selectedPrintingItem.process_company}
              </Text>
            )}
          </View>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#666"
          />
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.categoryOptions}>
            {/* 타입 선택 */}
            <View style={styles.typeSelectionSection}>
              <View style={styles.typeButtonsContainer}>
                {type.map((typeItem) => (
                  <TouchableOpacity
                    key={typeItem}
                    style={[
                      styles.typeButton,
                      selectedType === typeItem && styles.typeButtonActive,
                    ]}
                    onPress={() => setSelectedType(typeItem)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        selectedType === typeItem &&
                          styles.typeButtonTextActive,
                      ]}
                    >
                      {typeItem}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 회사 선택 (타입 선택 후에만 표시) */}
            {selectedType && (
              <View style={styles.companySelectionSection}>
                {options.map((option) => {
                  // 현재 선택된 항목인지 확인
                  const isSelected = processOrder.some(
                    (item) =>
                      item.process_category === "인쇄" &&
                      item.process_type === `${category}(${selectedType})` &&
                      item.process_company === option
                  );

                  return (
                    <TouchableOpacity
                      key={option}
                      style={styles.optionItem}
                      onPress={() => {
                        onInputChange(
                          "printing",
                          option,
                          selectedType,
                          category
                        );
                      }}
                    >
                      <Text style={styles.optionItemText}>{option}</Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color="#007AFF" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </View>
    );
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
                value={formData.task_title}
                onChangeText={(value) => handleInputChange("task_title", value)}
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
                value={formData.task_company}
                onChangeText={(value) =>
                  handleInputChange("task_company", value)
                }
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
                  ? openIosDatePicker("task_order_date")
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
                {formatDate(formData.task_order_date)}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>납품일</Text>
            <TouchableOpacity
              style={styles.inputWrapper}
              onPress={() =>
                Platform.OS === "ios"
                  ? openIosDatePicker("task_delivery_date")
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
                {formatDate(formData.task_delivery_date)}
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
                  !formData.delivery_type && styles.placeholderText,
                ]}
              >
                {formData.delivery_type || "납품방식을 선택하세요"}
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
                value={formData.task_desc}
                onChangeText={(value) => handleInputChange("task_desc", value)}
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
                value={formData.paper_size}
                onChangeText={(value) => handleInputChange("paper_size", value)}
                placeholder="315*467"
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
                value={formData.product_size}
                onChangeText={(value) =>
                  handleInputChange("product_size", value)
                }
                placeholder="210*297"
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
                value={formData.paper_type}
                onChangeText={(value) => handleInputChange("paper_type", value)}
                placeholder="아르떼 230g"
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
              disabled={optionsLoading}
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
                {optionsLoading
                  ? "옵션을 불러오는 중..."
                  : "인쇄 방식을 선택하세요"}
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
              <Text style={[styles.textInput]}>후가공을 선택하세요</Text>
              <Ionicons name="chevron-down-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* 후가공 순서 조절 섹션 */}
          {processOrder.length > 0 && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>공정 순서 조절</Text>
              <Text style={styles.orderDescription}>
                드래그하여 공정 순서를 조절하세요
              </Text>
              <View style={styles.orderListContainer}>
                {processOrder.map((item, index) => (
                  <DraggableProcessItem
                    key={`${item.id}-${index}`}
                    item={item}
                    index={index}
                    onReorder={handleReorder}
                  />
                ))}
              </View>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>우선순위</Text>
            <View style={styles.priorityContainer}>
              {["보통", "중요", "긴급"].map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityButton,
                    formData.task_priority === priority &&
                      styles.priorityButtonActive,
                  ]}
                  onPress={() => handleInputChange("task_priority", priority)}
                >
                  <Text
                    style={[
                      styles.priorityButtonText,
                      formData.task_priority === priority &&
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
          <TouchableOpacity
            onPress={handleSubmit}
            style={[
              styles.submitButton,
              createTaskMutation.isPending && styles.submitButtonDisabled,
            ]}
            disabled={createTaskMutation.isPending}
          >
            <Text style={styles.submitButtonText}>
              {createTaskMutation.isPending ? "생성 중..." : "작업 생성"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>

      {/* --- DatePicker 로직 --- */}
      {/* Android DatePicker */}
      {Platform.OS === "android" && showOrderDatePicker && (
        <DateTimePicker
          value={formData.task_order_date}
          mode="date"
          display="default"
          locale="ko-KR"
          onChange={(event, selectedDate) => {
            setShowOrderDatePicker(false);
            if (selectedDate) {
              handleDateChange("task_order_date", selectedDate);
            }
          }}
        />
      )}
      {Platform.OS === "android" && showDeliveryDatePicker && (
        <DateTimePicker
          value={formData.task_delivery_date}
          mode="date"
          display="default"
          locale="ko-KR"
          onChange={(event, selectedDate) => {
            setShowDeliveryDatePicker(false);
            if (selectedDate) {
              handleDateChange("task_delivery_date", selectedDate);
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
                  handleDateChange("task_order_date", pickerDate);
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
                  handleDateChange("task_delivery_date", pickerDate);
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
                    {deliveryMethodOptions.map((item) => {
                      const { category, options } = item;
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
                            <Text style={styles.categoryTitle}>{category}</Text>
                            <Ionicons
                              name={isExpanded ? "chevron-up" : "chevron-down"}
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
                                    handleInputChange("delivery_type", option);
                                  }}
                                >
                                  <Text style={styles.optionItemText}>
                                    {option}
                                  </Text>
                                  {formData.delivery_type === option && (
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
                    })}
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
                    {optionsLoading ? (
                      <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>
                          옵션을 불러오는 중...
                        </Text>
                      </View>
                    ) : printingMethodOptions.length > 0 ? (
                      printingMethodOptions.map((item) => (
                        <PrintingAccordion
                          key={item.category}
                          item={item}
                          formData={formData}
                          onInputChange={handleInputChange}
                        />
                      ))
                    ) : (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                          사용 가능한 인쇄 옵션이 없습니다.
                        </Text>
                      </View>
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
                    {optionsLoading ? (
                      <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>
                          옵션을 불러오는 중...
                        </Text>
                      </View>
                    ) : postProcessingOptions.length > 0 ? (
                      postProcessingOptions.map((item) => (
                        <PostProcessingAccordion
                          key={item.category}
                          item={item}
                          processOrder={processOrder}
                          onPostProcessingChange={handlePostProcessingChange}
                        />
                      ))
                    ) : (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                          사용 가능한 후가공 옵션이 없습니다.
                        </Text>
                      </View>
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
  submitButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.7,
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
  // --- Draggable Item Styles ---
  draggableItem: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  draggableItemContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  dragHandle: {
    marginRight: 10,
  },
  processIcon: {
    marginRight: 10,
  },
  draggableItemInfo: {
    flex: 1,
  },
  draggableItemCategory: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  draggableItemOption: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  orderNumber: {
    backgroundColor: "#F4F3FF",
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 30,
    alignItems: "center",
  },
  orderNumberText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "600",
  },
  orderDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
    marginBottom: 10,
  },
  orderListContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 10,
    marginTop: 5,
  },
  typeSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#D0D0D0",
  },
  typeTitle: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  typeSelectionSection: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#D0D0D0",
  },
  typeSelectionTitle: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  typeButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    paddingHorizontal: 10,
  },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f9f9f9",
    marginVertical: 5,
    marginHorizontal: 5,
  },
  typeButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  typeButtonText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  typeButtonTextActive: {
    color: "#fff",
  },
  companySelectionSection: {},
  companySelectionTitle: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
