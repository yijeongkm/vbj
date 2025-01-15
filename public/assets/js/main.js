window.onload = async function() {
    loadRandomImages();
    checkForMobile(); // 모바일 반응형 체크
    updateQuestionCount(); // 현재 문항 번호 업데이트 (추가된 부분)
    initializeImageClickListeners(); // 이미지 클릭 이벤트 초기화
    window.addEventListener('resize', checkForMobile);
    window.addEventListener('beforeunload', saveProgressBeforeExit); // 강제 종료 시 데이터 저장
};

// 총 문항 수 및 현재 문항 추적 변수
const totalQuestions = 30;
let currentQuestion = 1;
let currentSelection = null;
let surveyResults = [];

async function loadRandomImages() {
    try {
        const response = await fetch('/api/images');
        if (!response.ok) throw new Error('Network response was not ok ' + response.statusText);
        
        const data = await response.json();
        const images = data.imageUrls;

        if (images.length < 2) throw new Error('Not enough images to display');

        await Promise.all([preloadImage(images[0]), preloadImage(images[1])]);
        document.getElementById('image-left').src = images[0];
        document.getElementById('image-right').src = images[1];
        currentSelection = null; // 선택 상태 초기화

    } catch (error) {
        console.error('Error fetching images:', error);
    }
}

function checkForMobile() {
    const isMobile = window.innerWidth <= 1024;
    const leftButton = document.getElementById('leftButton');
    const rightButton = document.getElementById('rightButton');

    console.log('isMobile:', isMobile);

    if (isMobile) {
        // 모바일 환경에서는 버튼을 숨기고 이미지를 클릭하도록 설정
        leftButton.style.display = 'none';
        rightButton.style.display = 'none';

        console.log('Mobile mode: Buttons hidden, images are clickable.');

        initializeImageClickListeners(); // 모바일 환경에서 이미지 클릭 이벤트 설정
    } else {
        // 큰 화면에서는 버튼을 다시 표시
        leftButton.style.display = 'inline-block';
        rightButton.style.display = 'inline-block';

        console.log('Desktop mode: Buttons visible.');
    }
}

function preloadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = resolve;
        img.onerror = reject;
    });
}

// 배열을 랜덤하게 섞는 함수
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 이미지 클릭 이벤트 초기화 함수
function initializeImageClickListeners() {
    const leftImage = document.getElementById('image-left');
    const rightImage = document.getElementById('image-right');

    // 기존 이벤트 리스너 제거
    leftImage.replaceWith(leftImage.cloneNode(true));
    rightImage.replaceWith(rightImage.cloneNode(true));

    // 새로운 이벤트 리스너 추가
    const newLeftImage = document.getElementById('image-left');
    const newRightImage = document.getElementById('image-right');
    
    newLeftImage.addEventListener('click', () => {
        console.log('Left image clicked');
        selectImage('left');
    });

    newRightImage.addEventListener('click', () => {
        console.log('Right image clicked');
        selectImage('right');
    });
}

// 이미지 선택 함수
function selectImage(selection) {
    console.log(`selectImage called with selection: ${selection}`);

    const leftImage = document.getElementById('image-left');
    const rightImage = document.getElementById('image-right');

    if (selection === 'left') {
        leftImage.classList.add('selected');
        rightImage.classList.remove('selected');
    } else if (selection === 'right') {
        rightImage.classList.add('selected');
        leftImage.classList.remove('selected');
    }

    currentSelection = selection;

    // 디버깅용 로그 출력
    console.log(`Selected Image: ${selection}`);
    
}

function clearSelection() {
    document.getElementById('image-left').classList.remove('selected');
    document.getElementById('image-right').classList.remove('selected');
}

function updateQuestionCount() {
    document.getElementById('question-count').textContent = `문항 ${currentQuestion}/${totalQuestions}`;
}

// function saveProgressBeforeExit(event) {
//     if (surveyResults.length > 0) {
//         saveProgressToServer();
//     }
// }

function nextSelection() {
    if (currentSelection === null) {
        alert('이미지를 선택해주세요.');
        return;
    }

    const gender = document.getElementById('gender').value;
    const age = document.getElementById('age').value;
    const leftImage = document.getElementById('image-left').src;
    const rightImage = document.getElementById('image-right').src;

    const result = {
        gender: gender,
        age: age,
        selected: currentSelection,
        leftImage: leftImage,
        rightImage: rightImage,
        timestamp: new Date().toISOString()
    };

    surveyResults.push(result);

    fetch('/api/save', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ results: [result] })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        console.log('Result saved to server:', data);

        // 다음 설문으로 진행
        proceedToNextQuestion();
    })
    .catch(error => {
        console.error('Error saving result:', error);

        // 서버 저장 실패 시에도 다음 설문으로 진행
        proceedToNextQuestion();
    });
}

function proceedToNextQuestion() {

    // 선택 상태 초기화
    currentSelection = null;
    clearSelection();

    // 문항 카운트 증가
    currentQuestion++;
    console.log("Current Question:", currentQuestion);

    updateQuestionCount();

    document.getElementById('image-left').style.border = '';
    document.getElementById('image-right').style.border = '';
        
    document.getElementById('question-count').textContent = `문항 ${currentQuestion}/${totalQuestions}`;
    console.log("Current Question: ", currentQuestion); // 현재 문항 번호 확인

    // Save 버튼 표시 조건
    if (currentQuestion === totalQuestions) {
        setTimeout(() => {
            loadRandomImages();  // 다음 이미지를 로드
        }, 300);
        console.log("Displaying Save button");
        document.getElementById('save-btn').style.display = 'inline-block';
        document.getElementById('next-btn').style.display = 'none';
        console.log("30번째 문항 - Next 버튼 숨기고 Save 버튼 보이기");
    } else {
        document.getElementById('next-btn').style.display = 'inline-block';
        document.getElementById('save-btn').style.display = 'none';
        setTimeout(() => {
            loadRandomImages();  // 다음 이미지를 로드
        }, 300);
    }
}

function removeDuplicates(results) {
    const uniqueResults = [];
    const seen = new Set();

    results.forEach(item => {
        // 모든 필드를 문자열로 묶어 고유 키 생성
        const key = JSON.stringify(item);
        if (!seen.has(key)) {
            seen.add(key);
            uniqueResults.push(item); // 중복되지 않은 항목만 추가
        }
    });

    return uniqueResults;
}


// // 강제 종료 시 서버에 진행 중인 설문 데이터를 저장하는 함수 (추가된 부분)
// function saveProgressToServer() {
//     if (surveyResults.length > 0) {
//         const progressData = {
//             results: surveyResults,
//             savedAt: new Date().toISOString()
//         };

//         fetch('/api/save', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(progressData)
//         })
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error('Network response was not ok ' + response.statusText);
//             }
//             return response.text();
//         })
//         .then(data => {
//             console.log('Progress saved to server.');
//             surveyResults = []; // Reset survey results after saving
//         })
//         .catch(error => console.error('Error saving progress:', error));
//     }
// }

function saveSurvey() {
    if (surveyResults.length === 0) {
        alert('No survey results to save.');
        return;
    }

    // 중복 데이터 제거
    const uniqueResults = removeDuplicates(surveyResults);
    console.log('Unique results:', uniqueResults);

    // 한국 시간으로 저장 시간 생성
    const now = new Date();
    const savedAtKST = now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    const finalResult = {
        results: uniqueResults,
        savedAt: savedAtKST
    };

    fetch('/api/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(finalResult)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.text();
    })
    .then(data => {
        console.log('Survey results saved to server.');
        alert('설문조사가 완료되었습니다.\n참여해주셔서 감사합니다.');
        setTimeout(() => {
            window.close();
        }, 300);
    })
    .catch(error => console.error('Error saving survey results:', error));
}

function downloadResults() {
    const password = prompt('Enter the admin password:');
    if (password === '0507') {
        window.location.href = '/api/results';
    } else {
        alert('Incorrect password.');
    }
}