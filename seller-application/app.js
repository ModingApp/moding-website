const categoryData = {
  "한식": ["백반", "한정식", "기사식당", "국밥", "순대국", "설렁탕", "해장국", "육개장", "삼계탕", "찌개", "감자탕", "코다리찜", "보리밥·쌈밥", "죽", "백숙·닭한마리", "한식뷔페", "한식배달"],
  "중식": ["짜장면", "짬뽕", "탕수육", "중화요리", "마라탕", "마라샹궈", "훠궈", "양꼬치", "딤섬", "중식배달"],
  "일식": ["초밥", "회·사시미", "돈까스", "라멘", "우동", "소바", "덮밥", "카레", "가정식일식", "일식배달"],
  "양식": ["파스타", "스테이크", "리조또", "피자", "브런치", "샐러드", "수프", "그릴요리", "이탈리안", "프렌치", "양식배달"],
  "분식": ["떡볶이", "김밥", "튀김", "순대", "라볶이", "오뎅", "쫄면", "분식세트", "즉석떡볶이", "분식배달"],
  "치킨·호프": ["후라이드치킨", "양념치킨", "간장치킨", "순살치킨", "닭강정", "치킨세트", "호프", "맥주안주", "치킨배달"],
  "피자": ["오리지널피자", "씬피자", "시카고피자", "화덕피자", "조각피자", "피자세트", "파스타세트", "피자배달"],
  "버거·샌드위치": ["수제버거", "치킨버거", "비프버거", "샌드위치", "토스트", "핫도그", "랩", "버거세트", "버거배달"],
  "족발·보쌈": ["족발", "보쌈", "불족발", "냉채족발", "마늘보쌈", "족발보쌈세트", "막국수세트", "족발배달"],
  "고기구이": ["삼겹살", "목살", "소고기구이", "갈비", "곱창", "막창", "양고기", "닭갈비", "구이세트", "고기배달"],
  "해산물": ["회", "조개구이", "해물찜", "아구찜", "대게", "새우", "장어", "물회", "해산물세트", "해산물배달"],
  "국수·면요리": ["칼국수", "잔치국수", "비빔국수", "냉면", "막국수", "쌀국수", "우육면", "탄탄면", "면요리배달"],
  "카페·디저트": ["커피", "라떼", "스무디", "에이드", "케이크", "마카롱", "도넛", "빙수", "베이커리", "디저트배달"],
  "술집": ["이자카야", "포차", "와인바", "맥주펍", "칵테일바", "전통주점", "안주요리", "술집배달"],
  "도시락": ["한식도시락", "프리미엄도시락", "다이어트도시락", "샐러드도시락", "덮밥도시락", "단체도시락", "도시락배달"],
  "샐러드·포케": ["그린샐러드", "닭가슴살샐러드", "연어샐러드", "포케", "비건샐러드", "랩샐러드", "샐러드배달"],
  "찜·탕": ["갈비찜", "닭볶음탕", "찜닭", "김치찜", "아구탕", "매운탕", "부대찌개", "전골", "찜탕배달"],
  "아시아요리": ["태국요리", "베트남요리", "인도요리", "인도네시아요리", "싱가포르요리", "필리핀요리", "커리", "아시아요리배달"]
};

const permitCategoryData = {
  "식품제조·가공업": ["소스·양념", "장류", "향신료", "드레싱", "절임식품", "김치", "젓갈", "수산가공품", "건어물", "어묵·연육가공품", "냉동식품", "즉석조리식품", "HMR", "밀키트", "면류", "만두", "떡류", "두부·콩가공품", "곡류가공품", "과자·스낵", "베이커리", "디저트", "빙과류", "초콜릿·캔디", "음료베이스", "분말식품", "농축식품", "식용유지", "조미식품", "건강식품"],
  "식품첨가물제조업": ["향미증진제", "산도조절제", "보존료", "착색료", "감미료", "유화제", "혼합제제"],
  "즉석판매제조가공업": ["반찬", "즉석조리", "즉석섭취식품", "떡", "빵", "도시락", "샐러드", "밀키트", "탕·국", "간편식"],
  "식품소분업": ["견과류소분", "분말소분", "건어물소분", "소스소분", "차류소분", "스낵소분", "곡물소분", "냉동식품소분"],
  "식육가공업": ["햄", "소시지", "베이컨", "양념육", "분쇄가공육", "식육추출가공품", "돈가스", "떡갈비", "스테이크가공품"],
  "식육포장처리업": ["소고기포장", "돼지고기포장", "닭고기포장", "양고기포장", "부위별포장육", "냉장포장육", "냉동포장육"],
  "유가공업": ["우유", "발효유", "치즈", "버터", "크림", "분유", "아이스크림믹스", "유청가공품"],
  "식용란선별포장업": ["계란", "메추리알", "살균액란", "전란액", "난황액", "난백액", "포장란"],
  "주류제조면허": ["맥주", "탁주", "약주", "청주", "과실주", "증류주", "리큐르", "전통주", "소규모주류"],
  "수산물가공업": ["건조수산물", "염장수산물", "젓갈", "훈제수산물", "냉동수산물", "어묵", "해조류가공", "수산간편식"],
  "식품보존업": ["냉동보관", "냉장보관", "건조보존", "살균보존", "통조림", "레토르트", "진공포장"],
  "건강기능식품제조업": ["비타민", "미네랄", "프로바이오틱스", "오메가3", "홍삼", "단백질", "체지방관리", "눈건강", "간건강"],
  "건강기능식품전문제조업": ["정제", "캡슐", "분말", "액상", "젤리", "스틱포", "환", "구미", "OEM전문제조"]
};

const form = document.querySelector("#sellerForm");
const submitButton = document.querySelector("#submitButton");
const submitText = document.querySelector("[data-submit-text]");
const toast = document.querySelector("#toast");
const businessType = document.querySelector("#businessType");
const corporateNumberField = document.querySelector("#corporateNumberField");
const corporateNumberInput = document.querySelector("#corporateNumber");
const zipCodeInput = document.querySelector("#zipCode");
const addressInput = document.querySelector("#address");
const addressDetailInput = document.querySelector("#addressDetail");
const searchAddressButton = document.querySelector("#searchAddressButton");
const postcodeModal = document.querySelector("#postcodeModal");
const postcodeLayer = document.querySelector("#postcodeLayer");
const foodCategory = document.querySelector("#foodCategory");
const foodSubCategory = document.querySelector("#foodSubCategory");
const permitCategory = document.querySelector("#permitCategory");
const permitSubCategory = document.querySelector("#permitSubCategory");
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const POSTCODE_SCRIPT_URL = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
const previewUrls = new WeakMap();

const validators = {
  email: {
    test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: "올바른 이메일 형식으로 입력해주세요."
  },
  phone: {
    test: (value) => /^01[016789]-?\d{3,4}-?\d{4}$/.test(value),
    message: "올바른 휴대폰 번호를 입력해주세요."
  },
  businessNumber: {
    test: (value) => /^\d{3}-?\d{2}-?\d{5}$/.test(value),
    message: "사업자등록번호 10자리를 입력해주세요."
  },
  loginId: {
    test: (value) => /^[a-z0-9]{4,20}$/.test(value),
    message: "희망 아이디는 영문 소문자와 숫자 4~20자로 입력해주세요."
  },
  corporateNumber: {
    test: (value) => /^\d{6}-?\d{7}$/.test(value),
    message: "법인번호 13자리를 입력해주세요."
  },
  zipCode: {
    test: (value) => /^\d{5}$/.test(value),
    message: "우편번호 5자리를 입력해주세요."
  },
  accountNumber: {
    test: (value) => /^\d{8,20}$/.test(value.replaceAll("-", "")),
    message: "계좌번호는 숫자 8~20자리로 입력해주세요."
  }
};

function createOption(value, text = value) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = text;
  return option;
}

function populatePrimarySelect(select, data) {
  Object.keys(data).forEach((key) => select.append(createOption(key)));
}

function populateDependentSelect(parentSelect, childSelect, data, placeholder, emptyPlaceholder) {
  const selected = parentSelect.value;
  childSelect.innerHTML = "";

  if (!selected) {
    childSelect.append(createOption("", emptyPlaceholder));
    childSelect.disabled = true;
    return;
  }

  childSelect.append(createOption("", placeholder));
  data[selected].forEach((item) => childSelect.append(createOption(item)));
  childSelect.disabled = false;
}

function setError(field, message) {
  const error = document.querySelector(`[data-error-for="${field.name}"]`);
  field.setAttribute("aria-invalid", message ? "true" : "false");

  if (error) {
    error.textContent = message;
  }
}

function validateField(field) {
  if (field.disabled) {
    setError(field, "");
    return true;
  }

  const value = field.value.trim();

  if (field.dataset.required !== undefined && !value) {
    setError(field, "필수 입력 항목입니다.");
    return false;
  }

  if (field.dataset.validate && value) {
    const validator = validators[field.dataset.validate];
    if (validator && !validator.test(value)) {
      setError(field, validator.message);
      return false;
    }
  }

  setError(field, "");
  return true;
}

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function revokePreviewUrls(box) {
  const urls = previewUrls.get(box) || [];
  urls.forEach((url) => URL.revokeObjectURL(url));
  previewUrls.delete(box);
}

function clearFilePreview(box) {
  revokePreviewUrls(box);
  box.querySelector(".upload-preview")?.remove();
}

function createPreviewCard(file, box) {
  const card = document.createElement("div");
  card.className = "preview-card";

  const thumb = document.createElement("div");
  thumb.className = "preview-thumb";

  if (file.type.startsWith("image/")) {
    const image = document.createElement("img");
    const objectUrl = URL.createObjectURL(file);
    previewUrls.set(box, [...(previewUrls.get(box) || []), objectUrl]);
    image.src = objectUrl;
    image.alt = file.name;
    thumb.append(image);
  } else {
    thumb.textContent = "PDF";
  }

  const info = document.createElement("div");
  info.className = "preview-info";

  const name = document.createElement("div");
  name.className = "preview-name";
  name.textContent = file.name;

  const meta = document.createElement("div");
  meta.className = "preview-meta";
  meta.textContent = formatFileSize(file.size);

  info.append(name, meta);
  card.append(thumb, info);
  return card;
}

function renderFilePreview(input, files) {
  const box = input.closest("[data-upload-box]");
  const dropzone = box.querySelector(".dropzone");
  const preview = document.createElement("div");
  preview.className = input.multiple ? "upload-preview preview-scroll" : "upload-preview";

  clearFilePreview(box);
  files.forEach((file) => preview.append(createPreviewCard(file, box)));
  dropzone.append(preview);
}

function validateFileInput(input) {
  const files = [...input.files];
  const box = input.closest("[data-upload-box]");
  const status = box.querySelector("[data-file-status]");

  if (input.dataset.required !== undefined && !files.length) {
    setError(input, "필수 제출 서류입니다.");
    box.classList.remove("is-uploaded");
    clearFilePreview(box);
    status.textContent = "업로드 전";
    return false;
  }

  if (!files.length) {
    setError(input, "");
    box.classList.remove("is-uploaded");
    clearFilePreview(box);
    status.textContent = input.multiple ? "선택된 기타서류 없음" : "업로드 전";
    return true;
  }

  const invalidTypeFile = files.find((file) => !ALLOWED_FILE_TYPES.includes(file.type));
  if (invalidTypeFile) {
    setError(input, "PDF, JPG, PNG 파일만 업로드할 수 있습니다.");
    box.classList.remove("is-uploaded");
    clearFilePreview(box);
    status.textContent = `지원하지 않는 파일 형식: ${invalidTypeFile.name}`;
    return false;
  }

  const oversizeFile = files.find((file) => file.size > MAX_FILE_SIZE);
  if (oversizeFile) {
    setError(input, "파일 크기는 10MB 이하만 가능합니다.");
    box.classList.remove("is-uploaded");
    clearFilePreview(box);
    status.textContent = `파일 크기 초과: ${oversizeFile.name}`;
    return false;
  }

  setError(input, "");
  box.classList.add("is-uploaded");
  renderFilePreview(input, files);
  status.textContent = input.multiple
    ? `${files.length}개 파일 선택: ${files.map((file) => file.name).join(", ")}`
    : `업로드 완료: ${files[0].name}`;
  return true;
}

function validateForm() {
  const fields = [...form.querySelectorAll("input:not([type='file']), select")];
  const files = [...form.querySelectorAll("[data-file-input]")];
  const fieldResults = fields.map(validateField);
  const fileResults = files.map(validateFileInput);
  return [...fieldResults, ...fileResults].every(Boolean);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.classList.toggle("is-loading", isLoading);
  submitText.textContent = isLoading ? "제출 중..." : "신청서 제출";
}

function resetUploadStates() {
  document.querySelectorAll("[data-upload-box]").forEach((box) => {
    const input = box.querySelector("[data-file-input]");
    box.classList.remove("is-uploaded");
    clearFilePreview(box);
    box.querySelector("[data-file-status]").textContent = input?.multiple ? "선택된 기타서류 없음" : "업로드 전";
  });
}

function handleBusinessTypeChange() {
  const isCorporation = businessType.value === "corporation";
  corporateNumberField.classList.toggle("hidden", !isCorporation);
  corporateNumberInput.toggleAttribute("data-required", isCorporation);
  corporateNumberInput.value = "";
  setError(corporateNumberInput, "");
}

function buildAddress(data) {
  const selectedAddress = data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
  const extras = [];

  if (data.userSelectedType === "R") {
    if (data.bname && /[동|로|가]$/g.test(data.bname)) {
      extras.push(data.bname);
    }

    if (data.buildingName && data.apartment === "Y") {
      extras.push(data.buildingName);
    }
  }

  return extras.length ? `${selectedAddress} (${extras.join(", ")})` : selectedAddress;
}

function loadPostcodeScript() {
  if (window.daum?.Postcode) {
    return Promise.resolve();
  }

  const loadedScript = document.querySelector('script[data-postcode-script="true"][data-loaded="true"]');
  if (loadedScript) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = POSTCODE_SCRIPT_URL;
    script.async = true;
    script.dataset.postcodeScript = "true";
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = reject;

    document.head.append(script);
  });
}

function closePostcodeSearch() {
  postcodeModal.classList.remove("is-visible");
  postcodeModal.setAttribute("aria-hidden", "true");
  postcodeLayer.innerHTML = "";
}

function isFileProtocol() {
  return window.location.protocol === "file:";
}

async function openPostcodeSearch() {
  if (isFileProtocol()) {
    const message = "카카오 주소 검색은 file:// 직접 실행에서는 동작하지 않습니다. 터미널에서 python3 -m http.server 4173 실행 후 http://localhost:4173/index.html 로 접속해주세요.";
    showToast(message);
    alert(message);
    return;
  }

  try {
    await loadPostcodeScript();
  } catch {
    showToast("주소 검색 서비스를 불러오지 못했습니다. 네트워크 상태를 확인해주세요.");
    return;
  }

  if (!window.daum?.Postcode) {
    showToast("주소 검색 서비스 준비가 지연되고 있습니다. 잠시 후 다시 시도해주세요.");
    return;
  }

  postcodeLayer.innerHTML = "";
  postcodeModal.classList.add("is-visible");
  postcodeModal.setAttribute("aria-hidden", "false");

  new window.daum.Postcode({
    oncomplete(data) {
      zipCodeInput.value = data.zonecode;
      addressInput.value = buildAddress(data);
      addressDetailInput.value = "";

      validateField(zipCodeInput);
      validateField(addressInput);
      validateField(addressDetailInput);
      closePostcodeSearch();
      addressDetailInput.focus();
      showToast("주소가 자동 입력되었습니다. 상세주소를 입력해주세요.");
    }
  }).embed(postcodeLayer, {
    autoClose: false
  });
}

function handleFileDrop(dropzone, files) {
  const box = dropzone.closest("[data-upload-box]");
  const input = box.querySelector("[data-file-input]");

  if (!files.length) return;

  const dataTransfer = new DataTransfer();
  [...files].forEach((file) => {
    if (input.multiple || dataTransfer.items.length === 0) {
      dataTransfer.items.add(file);
    }
  });
  input.files = dataTransfer.files;
  validateFileInput(input);
}

function bindEvents() {
  form.addEventListener("input", (event) => {
    const field = event.target;
    if (field.matches("input:not([type='file'])")) {
      validateField(field);
    }
  });

  searchAddressButton.addEventListener("click", openPostcodeSearch);

  document.addEventListener("click", (event) => {
    if (!event.target.closest("[data-postcode-close]")) return;
    closePostcodeSearch();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && postcodeModal.classList.contains("is-visible")) {
      closePostcodeSearch();
    }
  });

  form.addEventListener("change", (event) => {
    const field = event.target;

    if (field === businessType) {
      handleBusinessTypeChange();
    }

    if (field === foodCategory) {
      populateDependentSelect(foodCategory, foodSubCategory, categoryData, "세부 카테고리를 선택해주세요", "1차 카테고리를 먼저 선택해주세요");
      validateField(foodCategory);
      validateField(foodSubCategory);
      return;
    }

    if (field === permitCategory) {
      populateDependentSelect(permitCategory, permitSubCategory, permitCategoryData, "허가 소분류를 선택해주세요", "대분류를 먼저 선택해주세요");
      validateField(permitCategory);
      validateField(permitSubCategory);
      return;
    }

    if (field.matches("select")) {
      validateField(field);
    }

    if (field.matches("[data-file-input]")) {
      validateFileInput(field);
    }
  });

  document.addEventListener("click", (event) => {
    const dropzone = event.target.closest(".dropzone");
    if (!dropzone) return;
    document.querySelector(`#${dropzone.getAttribute("aria-controls")}`).click();
  });

  document.addEventListener("keydown", (event) => {
    const dropzone = event.target.closest(".dropzone");
    if (!dropzone || !["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    document.querySelector(`#${dropzone.getAttribute("aria-controls")}`).click();
  });

  document.addEventListener("dragover", (event) => {
    const dropzone = event.target.closest(".dropzone");
    if (!dropzone) return;
    event.preventDefault();
    dropzone.classList.add("is-dragover");
  });

  document.addEventListener("dragleave", (event) => {
    const dropzone = event.target.closest(".dropzone");
    if (!dropzone) return;
    dropzone.classList.remove("is-dragover");
  });

  document.addEventListener("drop", (event) => {
    const dropzone = event.target.closest(".dropzone");
    if (!dropzone) return;
    event.preventDefault();
    dropzone.classList.remove("is-dragover");
    handleFileDrop(dropzone, event.dataTransfer.files);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      firstInvalid?.scrollIntoView({ behavior: "smooth", block: "center" });
      firstInvalid?.focus({ preventScroll: true });
      showToast("입력값을 다시 확인해주세요.");
      return;
    }

    setLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    setLoading(false);

    alert("판매자 입점 신청이 완료되었습니다.");
    showToast("신청서가 성공적으로 제출되었습니다.");
    form.reset();
    resetUploadStates();
    populateDependentSelect(foodCategory, foodSubCategory, categoryData, "세부 카테고리를 선택해주세요", "1차 카테고리를 먼저 선택해주세요");
    populateDependentSelect(permitCategory, permitSubCategory, permitCategoryData, "허가 소분류를 선택해주세요", "대분류를 먼저 선택해주세요");
    handleBusinessTypeChange();
    form.querySelectorAll("[aria-invalid]").forEach((field) => field.setAttribute("aria-invalid", "false"));
  });
}

function init() {
  populatePrimarySelect(foodCategory, categoryData);
  populatePrimarySelect(permitCategory, permitCategoryData);
  populateDependentSelect(foodCategory, foodSubCategory, categoryData, "세부 카테고리를 선택해주세요", "1차 카테고리를 먼저 선택해주세요");
  populateDependentSelect(permitCategory, permitSubCategory, permitCategoryData, "허가 소분류를 선택해주세요", "대분류를 먼저 선택해주세요");
  handleBusinessTypeChange();
  bindEvents();
}

init();
