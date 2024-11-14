---
layout: page
title: Gamerpedia
description: Gamerpedia is a project designed to simplify the process of video game selection for beginners and enthusiasts alike.
img: assets/img/DS_7330_Final_Term_Project/download.png
importance: 11
category: school
---

## **Project Overview**

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        <iframe width="1000" height="400" src="https://www.youtube.com/embed/qwOkIqizxDA?si=d8P5HAhsVyqnJcgG&amp;start=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
    </div>
</div>

### **Objective**
The goal of Gamerpedia is to enhance the gaming experience by:
1. **Recommending video games** tailored to user preferences using a custom-built recommendation engine powered by Machine Learning algorithms and ChatGPT.
2. Providing detailed information about video games, including:
   - Predicted playtime
   - Popularity and reviews
   - News, trailers, and top streamers

### **Motivation**
- With a vast array of games available, users often hesitate to explore new titles due to the fear of wasting money on unappealing games.
- Gamerpedia aims to address this issue by offering personalized recommendations and relevant game details, making the process easier and more enjoyable.

### **Powerpoint Presentation**
Here’s the powerpoint presentation of the Project:

<iframe src="https://smu365-my.sharepoint.com/personal/oowolabi_smu_edu/_layouts/15/Doc.aspx?sourcedoc={160c1808-2ba8-46d8-a7df-cc1761c17f63}&amp;action=embedview&amp;wdAr=1.7777777777777777" width="1000px" height="800px" frameborder="0">This is an embedded <a target="_blank" href="https://office.com">Microsoft Office</a> presentation, powered by <a target="_blank" href="https://office.com/webapps">Office</a>.</iframe>

---

## **Key Features**

1. **Game Recommendation Engine**:
   - Suggests games based on user preferences (e.g., genre, platform, multiplayer options).
   - Uses ChatGPT to rank games when multiple options match user preferences.

2. **Game Encyclopedia**:
   - Provides in-depth details about selected games, including playtime, popularity, and reviews.
   - Integrates APIs (e.g., IGDB, GiantBomb) to fetch game information like cover images and streaming content.

3. **Database Schema Design**:
   - Designed a robust database schema with **11 attributes** (e.g., release year, genre, platform) and **1.17 million rows** of game data.
   - Data sourced from Kaggle datasets, cleaned, and optimized for efficient queries.

4. **Web Application**:
   - Built using **Python Django** for backend and **HTML/CSS** for frontend.
   - Features include:
     - User authentication (login/sign-up).
     - Preference selection via a user-friendly interface.
     - API integration for fetching real-time data.

---

## **Methodology**

1. **Web Development**:
   - Developed using Python Django for backend operations and HTML/CSS for frontend design.
   - Optimized navigation and security features for a seamless user experience.

2. **Database Implementation**:
   - Combined datasets into a unified schema using MySQL.
   - Cleaned data by removing duplicates and filling missing values.

3. **Recommendation Algorithm**:
   - Used a hybrid algorithm combining user preferences, database filtering, and ChatGPT for ranking recommendations.
   - Limited suggestions to the top 5 games based on Metacritic scores.

4. **Game Encyclopedia**:
   - Integrated APIs to provide dynamic information like news, reviews, and trailers.
   - Redirects users to external pages (e.g., GiantBomb) for detailed insights.

---

## **Results**

1. **User Interface**:
   - Visually appealing and intuitive design.
   - Features easy navigation, user authentication, and preference selection.

2. **Database**:
   - Successfully implemented a schema with over **1.17 million rows** and **39 attributes**, optimized for performance.

3. **Recommendation Engine**:
   - Provides accurate and personalized recommendations.
   - Successfully integrates ChatGPT for ranking.

4. **Game Encyclopedia**:
   - Fetches detailed information about games through API calls.
   - Enables users to explore gameplay videos and news.

---

## **Future Work**

1. Replace missing values with accurate data.
2. Optimize the game encyclopedia for web usage.
3. Add user-specific graphs and charts based on preferences.
4. Deploy the app on the cloud for global accessibility.
5. Implement a web scraping feature for real-time game data extraction.

---

## **Files**

### 1. **Project Proposal**
- File: [Project Proposal](https://github.com/DamilolaOwolabi/DS_7330_Term_Project/blob/master/OwolabiProjectProposal.pdf)
- Outlines the problem, objectives, methodology, and timeline for Gamerpedia.

### 2. **Final Research Paper**
- File: [Final Research Paper](https://github.com/DamilolaOwolabi/DS_7330_Term_Project/blob/master/DS%207330%20PROJECT%20FINAL%20RESEARCH%20PAPER.pdf)
- Details the solution methodology, database implementation, recommendation engine, and analysis.

### 3. **Final Presentation**
- File: [Final Term Presentation](https://github.com/DamilolaOwolabi/DS_7330_Term_Project/blob/master/Owolabi_Final_Term_Presentation.pptx)
- Highlights key results, future work, and project demo.

---

## **Technologies Used**

- **Languages**: Python, HTML, CSS, JavaScript
- **Frameworks**: Django, MySQL Workbench
- **APIs**: IGDB, GiantBomb, ChatGPT API
- **Tools**:
  - Jupyter Notebook (for HTML generation)
  - VSCode (for development)

---

## **References**

1. Quantic Foundry: [Video Game Recommendation Engine](https://apps.quanticfoundry.com/recommendations/gamerprofile/videogame/)
2. Games Finder: [Game Recommendations](https://gameslikefinder.com/)
3. Twitch: [Streaming Service](https://www.twitch.tv/)
4. IGN: [Game News](https://www.ign.com/)
5. YouTube: [Game Playthroughs](https://www.youtube.com/)
6. Digital Trends: [Gaming Insights](https://www.digitaltrends.com/gaming/game-ownership-digital-media-players-weigh/)

---

## **Conclusion**

Gamerpedia is an innovative platform that streamlines the video game selection process for beginners and enthusiasts. By combining advanced recommendation algorithms, a rich game encyclopedia, and an intuitive web application, Gamerpedia empowers users to discover and select games tailored to their preferences. Future iterations will focus on optimizing the app and expanding its features for a global audience.

For questions or feedback, feel free to reach out!