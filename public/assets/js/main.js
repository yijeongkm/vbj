window.onload = function() {
    loadRandomImages();
};

function loadRandomImages() {
    fetch('/api/images')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            const images = data.imageUrls;

            if (images.length < 2) {
                throw new Error('Not enough images to display');
            }

            // 두 개의 이미지를 각각의 컨테이너에 배치
            document.getElementById('image-left').src = images[0];
            document.getElementById('image-right').src = images[1];
        })
        .catch(error => console.error('Error fetching images:', error));
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

    surveyResults.push(result);

    console.log('Selection saved locally.');
    currentSelection = null; // Reset selection
    // 이미지 선택 테두리 초기화
    document.getElementById('image-left').style.border = '';
    document.getElementById('image-right').style.border = '';
    // 이미지를 로드할 때 새로운 setTimeout으로 딜레이를 주어 동기화 문제 해결
    setTimeout(() => {
        loadRandomImages();
    }, 500);
}

function saveSurvey() {
    if (surveyResults.length === 0) {
        alert('No survey results to save.');
        return;
    }

    const finalResult = {
        results: surveyResults,
        savedAt: new Date().toISOString()
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
        alert('Survey results saved.');
        surveyResults = []; // Reset survey results
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
