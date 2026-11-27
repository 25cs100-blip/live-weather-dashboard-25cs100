
// API URLs
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

// Get HTML elements
const form = document.getElementById("form");
const cityInput = document.getElementById("city");
const searchBtn = document.getElementById("search-btn");
const statusMessage = document.getElementById("status");
const currentWeather = document.getElementById("current-weather");
const forecast = document.getElementById("forecast");

// Weather code information
const weatherInfo = {
    0: { text: "Clear Sky", icon: "☀️" },
    1: { text: "Mainly Clear", icon: "🌤️" },
    2: { text: "Partly Cloudy", icon: "⛅" },
    3: { text: "Cloudy", icon: "☁️" },
    45: { text: "Foggy", icon: "🌫️" },
    48: { text: "Foggy", icon: "🌫️" },
    51: { text: "Light Drizzle", icon: "🌦️" },
    53: { text: "Drizzle", icon: "🌦️" },
    55: { text: "Heavy Drizzle", icon: "🌧️" },
    56: { text: "Freezing Drizzle", icon: "🌧️" },
    57: { text: "Freezing Drizzle", icon: "🌧️" },
    61: { text: "Light Rain", icon: "🌧️" },
    63: { text: "Rain", icon: "🌧️" },
    65: { text: "Heavy Rain", icon: "🌧️" },
    66: { text: "Freezing Rain", icon: "🌧️" },
    67: { text: "Freezing Rain", icon: "🌧️" },
    71: { text: "Light Snow", icon: "🌨️" },
    73: { text: "Snow", icon: "❄️" },
    75: { text: "Heavy Snow", icon: "❄️" },
    77: { text: "Snow Grains", icon: "❄️" },
    80: { text: "Rain Showers", icon: "🌦️" },
    81: { text: "Rain Showers", icon: "🌧️" },
    82: { text: "Heavy Showers", icon: "⛈️" },
    85: { text: "Snow Showers", icon: "🌨️" },
    86: { text: "Heavy Snow Showers", icon: "❄️" },
    95: { text: "Thunderstorm", icon: "⛈️" },
    96: { text: "Thunderstorm with Hail", icon: "⛈️" },
    99: { text: "Thunderstorm with Hail", icon: "⛈️" }
};

// Get weather description
function getWeatherInfo(code) {
    return weatherInfo[code] || {
        text: "Unknown Weather",
        icon: "🌡️"
    };
}

// Find city using Geocoding API
async function findCity(name) {

    const url = GEO_URL +
        "?count=1&name=" + encodeURIComponent(name);

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("City search service is unavailable.");
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        throw new Error("City not found. Please try another city.");
    }

    const city = data.results[0];

return {
    name: city.name.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
    country: city.country || "",
    latitude: city.latitude,
    longitude: city.longitude
};
}

// Get weather using Forecast API
async function getWeather(lat, lon) {

    const url = WEATHER_URL +
        "?latitude=" + lat +
        "&longitude=" + lon +
        "&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m" +
        "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
        "&forecast_days=5&timezone=auto";

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Unable to load weather information.");
    }

    return await response.json();
}

// Create an HTML element safely
function createElement(tag, className, text) {

    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

// Display current weather
function displayCurrent(city, data) {

    const current = data.current;
    const info = getWeatherInfo(current.weather_code);

    currentWeather.replaceChildren();

    const heading = createElement(
        "h2",
        "",
        city.name + ", " + city.country
    );

    const icon = createElement(
        "div",
        "weather-icon",
        info.icon
    );

    icon.setAttribute("role", "img");
    icon.setAttribute("aria-label", info.text);

    const temperature = createElement(
        "p",
        "temperature",
        Math.round(current.temperature_2m) + "°C"
    );

    const condition = createElement(
        "p",
        "condition",
        info.text
    );

    const details = createElement("div", "weather-details");

    details.append(
        createElement(
            "p",
            "",
            "Feels like: " +
            Math.round(current.apparent_temperature) + "°C"
        ),
        createElement(
            "p",
            "",
            "Humidity: " + current.relative_humidity_2m + "%"
        ),
        createElement(
            "p",
            "",
            "Wind: " + current.wind_speed_10m + " km/h"
        )
    );

    currentWeather.append(
        heading,
        icon,
        temperature,
        condition,
        details
    );
}

// Display five-day forecast
function displayForecast(data) {

    forecast.replaceChildren();

    const daily = data.daily;

    daily.time.forEach(function(date, index) {

        const info = getWeatherInfo(
            daily.weather_code[index]
        );

        const card = createElement("article", "forecast-card");

        const day = new Date(date + "T12:00:00")
            .toLocaleDateString("en-US", {
                weekday: "short"
            });

        const heading = createElement("h3", "", day);

        const icon = createElement(
            "div",
            "weather-icon",
            info.icon
        );

        icon.setAttribute("role", "img");
        icon.setAttribute("aria-label", info.text);

        const condition = createElement(
            "p",
            "",
            info.text
        );

        const maxTemp = createElement(
            "p",
            "",
            "High: " + Math.round(daily.temperature_2m_max[index]) + "°C"
        );

        const minTemp = createElement(
            "p",
            "",
            "Low: " + Math.round(daily.temperature_2m_min[index]) + "°C"
        );

        card.append(
            heading,
            icon,
            condition,
            maxTemp,
            minTemp
        );

        forecast.append(card);

    });
}

// Search weather
async function searchWeather(name) {

    const cityName = name.trim();

    if (!cityName) {
        statusMessage.textContent = "Please enter a city name.";
        return;
    }

    searchBtn.disabled = true;
    searchBtn.textContent = "Loading...";

    statusMessage.textContent = "Searching for weather...";
    currentWeather.replaceChildren();
    forecast.replaceChildren();

    try {

        // Find the city
        const city = await findCity(cityName);

        // Get its weather
        const weather = await getWeather(
            city.latitude,
            city.longitude
        );

        // Display results
        displayCurrent(city, weather);
        displayForecast(weather);

        statusMessage.textContent =
            "Weather successfully loaded!";

        // Remember last searched city
        try {
            localStorage.setItem("lastCity", city.name);
        } catch (storageError) {
            console.warn("Could not save the last city.");
        }

    } catch (error) {

        statusMessage.textContent =
            error instanceof TypeError
                ? "Network problem. Please check your internet connection."
                : error.message;

    } finally {

        searchBtn.disabled = false;
        searchBtn.textContent = "Search";

    }
}

// Handle form submission
form.addEventListener("submit", function(event) {

    event.preventDefault();

    searchWeather(cityInput.value);

});

// Load last searched city
try {

    const lastCity = localStorage.getItem("lastCity");

    if (lastCity) {
        cityInput.value = lastCity;
        searchWeather(lastCity);
    }

} catch (error) {
    console.warn("Could not load the last searched city.");
}
