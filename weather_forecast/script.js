

const apiKey = "Your key";

const cityInput = document.getElementById("cityInput");
const btn = document.getElementById("getWeatherBtn");
const weatherBox = document.getElementById("weatherData");
const forecastBox = document.getElementById("forecast-week");



const radarMap = L.map("radar-map").setView([52.0, 19.0], 6);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
}).addTo(radarMap);

const precipitation = L.tileLayer(
    `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}`,
    { opacity: 0.8 }
).addTo(radarMap);

const clouds = L.tileLayer(
    `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey}`,
    { opacity: 0.7 }
);

const wind = L.tileLayer(
    `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${apiKey}`,
    { opacity: 0.9 }
);

L.control.layers(
    { "Opady": precipitation, "Chmury": clouds, "Wiatr": wind },
    {}
).addTo(radarMap);



const radarFrames = [];
let currentFrame = 0;
let radarLayer = null;

async function loadRadarFrames() {
    const now = Math.floor(Date.now() / 1000);

    for (let i = 9; i >= 0; i--) {
        const timestamp = now - i * 600;

        const frameUrl =
            `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}&ts=${timestamp}`;

        radarFrames.push(
            L.tileLayer(frameUrl, { opacity: 0.6 })
        );
    }

    startRadarAnimation();
}

function startRadarAnimation() {
    if (radarFrames.length === 0) return;

    radarLayer = radarFrames[0].addTo(radarMap);

    setInterval(() => {
        radarMap.removeLayer(radarLayer);
        currentFrame = (currentFrame + 1) % radarFrames.length;
        radarLayer = radarFrames[currentFrame].addTo(radarMap);
    }, 700);
}

loadRadarFrames();



btn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city) getWeather(city);
});

async function getWeather(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=pl`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Nie znaleziono miasta");

        const data = await response.json();
        displayWeather(data);
        getWeekForecast(data.coord.lat, data.coord.lon);

    } catch (error) {
        weatherBox.innerHTML =
            `<p style="color:red; font-size:20px;">${error.message}</p>`;
    }
}



function displayWeather(data) {
    const { main, weather, wind } = data;

    const condition = weather[0].main.toLowerCase();

    const video = document.getElementById("bgVideo");
    const source = document.getElementById("bgSource");

    if (condition.includes("clear")) {
        source.src = "img/sun.mp4";
    }
    else if (condition.includes("cloud")) {
        source.src = "img/clovercloud.mp4";
    }
    else if (condition.includes("rain") || condition.includes("drizzle")) {
        source.src = "img/rain.mp4";
    }
    else if (condition.includes("snow")) {
        source.src = "img/snow.mp4";
    }
    else if (condition.includes("thunderstorm")) {
        source.src = "img/tunderstorm.mp4";
    }
    else {
        source.src = "img/clovercloud.mp4";
    }

    video.load();
    video.play();


    weatherBox.innerHTML = `
        <div class="weather-current__info">
            <div>
                <img class="weather-icon" src="img/sun.png">
            </div>

            <div class="weather-current__temp">${Math.round(main.temp)}°C</div>

            <div class="weather-current__details">
                <div class="weather-detail">
                    <img class="weather-detail__icon" src="img/wind.png">
                    <span>WIATR</span>
                    <span>${wind.speed} m/s</span>
                </div>

                <div class="weather-detail">
                    <img class="weather-detail__icon" src="img/humidity.png">
                    <span>WILGOTNOŚĆ</span>
                    <span>${main.humidity}%</span>
                </div>

                <div class="weather-detail">
                    <img class="weather-detail__icon" src="img/align-left.png">
                    <span>OPIS</span>
                    <span>${weather[0].description}</span>
                </div>
            </div>
        </div>
    `;
}


async function getWeekForecast(lat, lon) {
    const url =
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pl`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        displayWeekForecast(data.list);

    } catch (error) {
        forecastBox.innerHTML =
            `<p style="color:red;">Błąd pobierania prognozy</p>`;
    }
}

function displayWeekForecast(list) {
    forecastBox.innerHTML = "";

    const daily = list.filter(item => item.dt_txt.includes("12:00:00"));

    daily.forEach(day => {
        const date = new Date(day.dt * 1000);
        const weekday = date.toLocaleDateString("pl-PL", { weekday: "long" });

        forecastBox.innerHTML += `
            <div class="forecast-day">
                <h4>${weekday}</h4>
                <img src="img/sun.png">
                <p>${Math.round(day.main.temp)}°C</p>
                <p>${day.weather[0].description}</p>
            </div>
        `;
    });
}





















/*
async function getWeekForecast(lat, lon) {
    const url =
        `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}` +
        `&exclude=current,minutely,hourly,alerts&units=metric&lang=pl&appid=${apiKey}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            const text = await response.text().catch(() => '');
            console.error("Błąd API OneCall:", response.status, text);
            return;
        }

        const data = await response.json();

        if (!data.daily || !Array.isArray(data.daily)) {
            console.error("Brak poprawnego pola daily w odpowiedzi API:", data);
            return;
        }

        displayWeekForecast(data.daily);

    } catch (err) {
        console.error("Problem z pobraniem prognozy tygodniowej:", err);
    }
}

function displayWeekForecast(days = []) {
    const box = document.getElementById('weekForecast');

    if (!box) {
        console.error("Nie znaleziono elementu o id 'weekForecast' w DOM.");
        return;
    }

    box.innerHTML = "";

    const dayNames = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"];

    days.slice(0, 7).forEach(day => {
        // dodatkowe zabezpieczenia na wypadek dziwnej odpowiedzi z API
        if (!day || !day.weather || !day.weather[0] || !day.temp) {
            console.warn("Niepełne dane dnia w daily:", day);
            return;
        }

        const date = new Date(day.dt * 1000);
        const name = dayNames[date.getDay()];

        box.innerHTML += `
            <div class="day-box">
                <div>${name}</div>
                <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png">
                <div>${Math.round(day.temp.day)}°C</div>
                <div style="font-size:14px">${day.weather[0].description}</div>
            </div>
        `;
    });
}
    */