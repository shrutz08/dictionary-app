const form = document.querySelector('form');
const resultDiv = document.querySelector('.result');
let modeBtn = document.querySelector("#mode");
let currMode = "light";

// Retrieve mode from localStorage if available, otherwise default to "light"
document.addEventListener('DOMContentLoaded', () => {
    const storedMode = localStorage.getItem('theme'); //
    if (storedMode) { //
        currMode = storedMode; //
        document.body.classList.toggle("dark", currMode === "dark"); //
        // If it's dark mode, set light background for 'light' transition back
        if (currMode === "dark") { //
            document.body.style.backgroundColor = ""; // Reset body background if dark mode is active
        } else { //
            document.body.style.backgroundColor = "#f5f5f5"; //
        }
    }
});


modeBtn.addEventListener('click', () => {
    if (currMode === "light") {
        currMode = "dark";
        document.body.classList.add("dark"); //
        document.body.classList.remove("light"); // 'light' class was never added, so remove is not strictly necessary but harmless.
        document.body.style.backgroundColor = ""; // Remove inline style for dark mode to let CSS variable take over
    } else {
        currMode = "light";
        document.body.classList.remove("dark"); //
        document.body.style.backgroundColor = "#f5f5f5"; // Set explicit light mode background color
    }
    localStorage.setItem('theme', currMode); // Store the current mode in localStorage
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const word = form.elements[0].value.trim(); // Trim whitespace from input
    if (word) { // Ensure word is not empty
        getWordInfo(word);
    } else {
        resultDiv.innerHTML = `<p>Please enter a word to search.</p>`; //
    }
});


const getWordInfo = async (word) => {
    try {
        resultDiv.innerHTML = "Fetching Data....";
        resultDiv.classList.remove('error'); // Clear previous error styles

        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);

        if (!response.ok) { // Check for HTTP errors
            if (response.status === 404) {
                throw new Error("Sorry, the word could not be found in the dictionary."); // More specific error
            } else {
                throw new Error(`HTTP error! Status: ${response.status}`); // General HTTP error
            }
        }

        const data = await response.json();

        // Check if data is an array and has at least one element
        if (!Array.isArray(data) || data.length === 0) { //
            throw new Error("No definitions found for this word."); //
        }

        const audioUrl = data[0].phonetics.find(p => p.audio && p.audio.endsWith('.mp3'))?.audio || ""; // Prefer .mp3 and ensure it exists
        // Handle cases where meanings or definitions might be missing
        const meanings = data[0].meanings; //
        const definition = meanings && meanings.length > 0 && meanings[0].definitions && meanings[0].definitions.length > 0
            ? meanings[0].definitions[0] : {}; //

        resultDiv.innerHTML = `
            <div class="word-sound">
                <h2><strong>Word :</strong> ${data[0].word}</h2>
                <i class="fa-solid fa-volume-high" style="color: #19191a; cursor: pointer;"></i>
            </div>
            <p class="partOfSpeech">${meanings && meanings.length > 0 ? meanings[0].partOfSpeech : 'Not Found'}</p>
            <p><strong>Meaning:</strong> ${definition.definition || "Not Found"}</p>
            <p><strong>Example:</strong> ${definition.example || "Not Found"}</p>
            <p><strong>Antonyms:</strong></p>
        `;

        // Antonyms
        if (definition.antonyms && definition.antonyms.length > 0) { //
            let antonymsHtml = '<ul>'; //
            definition.antonyms.forEach(antonym => { // Use forEach for cleaner iteration
                antonymsHtml += `<li>${antonym}</li>`; //
            });
            antonymsHtml += '</ul>'; //
            resultDiv.innerHTML += antonymsHtml; //
        } else {
            resultDiv.innerHTML += `<span>Not Found</span>`;
        }

        // Synonyms
        resultDiv.innerHTML += `<p><strong>Synonyms:</strong></p>`; //
        if (definition.synonyms && definition.synonyms.length > 0) { //
            let synonymsHtml = '<ul>'; //
            definition.synonyms.forEach(synonym => { // Use forEach for cleaner iteration
                synonymsHtml += `<li>${synonym}</li>`; //
            });
            synonymsHtml += '</ul>'; //
            resultDiv.innerHTML += synonymsHtml; //
        } else {
            resultDiv.innerHTML += `<span>Not Found</span>`;
        }

        // Adding Read More Button
        if (data[0].sourceUrls && data[0].sourceUrls.length > 0) { //
            resultDiv.innerHTML += `<div><a href="${data[0].sourceUrls[0]}" target="_blank">Read More</a></div>`; //
        }

        // Adding Sound Functionality
        const speaker = resultDiv.querySelector(".word-sound i"); // Select speaker from within resultDiv
        if (speaker) { // Ensure speaker element exists
            speaker.addEventListener('click', () => {
                if (audioUrl) {
                    const audio = new Audio(audioUrl);
                    audio.play();
                } else {
                    alert("No audio available for this word.");
                }
            });
        }

    } catch (error) {
        console.error("Error fetching word info:", error); // Log the actual error for debugging
        resultDiv.innerHTML = `<p class="error-message">Sorry, an error occurred: ${error.message || "The word could not be found."}</p>`; //
        resultDiv.classList.add('error'); // Add a class for error styling
    }
};