window.onload = function() {
    loadRandomImages();
    checkForMobile(); // 모바일 반응형 체크
    updateQuestionCount(); // 현재 문항 번호 업데이트 (추가된 부분)
    window.addEventListener('resize', checkForMobile);
    window.addEventListener('beforeunload', saveProgressBeforeExit); // 강제 종료 시 데이터 저장 (추가된 부분)
};

// 총 문항 수 및 현재 문항 추적 변수
const totalQuestions = 30;
let currentQuestion = 1;

// 강제 종료 시 현재까지의 설문 데이터를 저장하는 함수 (추가된 부분)
function saveProgressBeforeExit(event) {
    if (surveyResults.length > 0) {
        saveProgressToServer();
    }
}

// 모바일 반응형 처리 함수
function checkForMobile() {
    if (window.innerWidth <= 768) {
        document.getElementById('leftButton').innerText = 'Up';
        document.getElementById('rightButton').innerText = 'Down';
    } else {
        document.getElementById('leftButton').innerText = 'Left';
        document.getElementById('rightButton').innerText = 'Right';
    }
}

// 현재 문항 번호 업데이트 함수 (추가된 부분)
function updateQuestionCount() {
    document.getElementById('question-count').textContent = `문항 ${currentQuestion}/${totalQuestions}`;
}

async function loadRandomImages() {
    try {
        const response = await fetch('/api/images');
        if (!response.ok) throw new Error('Network response was not ok ' + response.statusText);
        
        const data = await response.json();
        const images = data.imageUrls;

        if (images.length < 2) throw new Error('Not enough images to display');

        // 미리 이미지 로드
        await Promise.all([preloadImage(images[0]), preloadImage(images[1])]);
        document.getElementById('image-left').src = images[0];
        document.getElementById('image-right').src = images[1];
    } catch (error) {
        console.error('Error fetching images:', error);
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

let currentSelection = null;
let surveyResults = [];

function selectImage(selection) {
    currentSelection = selection;
    // 이미지가 변경된 것을 시각적으로 확인하기 위해 선택된 이미지의 테두리를 강조
    if (selection === 'left') {
        document.getElementById('image-left').style.border = '5px solid blue';
        document.getElementById('image-right').style.border = '';
    } else if (selection === 'right') {
        document.getElementById('image-right').style.border = '5px solid blue';
        document.getElementById('image-left').style.border = '';
    }
}

function nextSelection() {
    if (currentSelection === null) {
        alert('Please select an image before proceeding.');
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
        rightImage: rightImage
    };

    fetch('/api/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(result)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.text();
    })
    .then(data => {
        console.log('Result saved to server:', data);

        // 저장 완료 후 다음 작업 진행
        surveyResults.push(result);
        currentSelection = null;
        document.getElementById('image-left').style.border = '';
        document.getElementById('image-right').style.border = '';
        
        // 문항 카운트 증가
        currentQuestion++;
        document.getElementById('question-count').textContent = `문항 ${currentQuestion}/${totalQuestions}`;
        console.log("Current Question: ", currentQuestion); // 현재 문항 번호 확인

        // **수정된 부분**: 문항이 30일 때 Save 버튼을 보여줌
        if (currentQuestion === totalQuestions) {
            console.log("Displaying Save button");
            document.getElementById('save-btn').style.display = 'inline-block';
            document.getElementById('next-btn').style.display = 'none';
            console.log("30번째 문항 - Next 버튼 숨기고 Save 버튼 보이기");
        } else {
            document.getElementById('next-btn').style.display = 'inline-block'; // Next 버튼을 다시 보임
            document.getElementById('save-btn').style.display = 'none'; // Save 버튼 숨기기
            setTimeout(() => {
                loadRandomImages();  // 다음 이미지를 로드
            }, 300);
        }
    })
    .catch(error => console.error('Error saving result:', error));
}

// 강제 종료 시 서버에 진행 중인 설문 데이터를 저장하는 함수 (추가된 부분)
function saveProgressToServer() {
    if (surveyResults.length > 0) {
        const progressData = {
            results: surveyResults,
            savedAt: new Date().toISOString()
        };

        fetch('/api/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(progressData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.text();
        })
        .then(data => {
            console.log('Progress saved to server.');
            surveyResults = []; // Reset survey results after saving
        })
        .catch(error => console.error('Error saving progress:', error));
    }
}

function saveSurvey() {
    if (surveyResults.length === 0) {
        alert('No survey results to save.');
        return;
    }

    const lastResult = {
        ...surveyResults[surveyResults.length - 1],  // 마지막 문항 결과
        end: true  // 마지막 문항에 end 추가
    };
    surveyResults[surveyResults.length - 1] = lastResult;

    const finalResult = {
        results: surveyResults,
        savedAt: new Date().toISOString()
    };
    
    // 서버에 마지막 결과와 end만 저장
    fetch('/api/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(finalResult)  // 마지막 문항과 end를 포함한 전체 결과 저장
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.text();
    })
    .then(data => {
        console.log('Survey results saved to server.');
        alert('Survey results saved.\n설문조사에 시간을 할애해주셔서 감사드립니다.');
        setTimeout(() => {
            window.close(); // 설문 완료 후 창 닫기
        }, 300);
    })
    .catch(error => console.error('Error saving survey results:', error));
}

function downloadResults() {
    const password = prompt('Enter the admin password:');
    if (password === '4532') {
        window.location.href = '/api/results';
    } else {
        alert('Incorrect password.');
    }
}
