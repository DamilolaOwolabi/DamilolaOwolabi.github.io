---
layout: page
title: Richest People Ranking Animation
description: The project aims to dynamically display the top 10 billionaires over the course of 2000 - 2021
img: assets/img/DS_6390_Exam_1/Thumbnail/DS_6390_Exam_1_Thumbnail.jpeg
importance: 4
category: school
---

#### **Project Overview**
This project visualizes the top 10 billionaires by net worth over different years using **Processing.js**. The animation provides a dynamic, visual comparison of billionaires’ net worth, including nationality and the source of their wealth through flags and company logos.

#### **Purpose**
- **Visualize billionaire data**: Display the top 10 billionaires from various years, highlighting changes in net worth and rankings.
- **Animate transitions**: Show smooth animations between years to give a clearer understanding of how billionaire rankings have evolved.
- **Add context**: Include visual elements like country flags and company logos to make the data more meaningful.

#### **Features**
- Animated bar chart representing the net worth of billionaires.
- Interactive controls (Play, Pause, Step through years).
- Company logos and national flags for additional context.
- Smooth transitions between year-to-year changes in rankings.

#### **Dataset**
The dataset used for this animation contains:
- **Year**: The year of the data.
- **Billionaire**: Name of the billionaire.
- **Net Worth**: Billionaire's net worth in billions of dollars (USD).
- **Nationality**: The billionaire’s country of origin.
- **Source of Wealth**: The main source of wealth (e.g., company).

#### **Tools Used**
- **processing 4.3**: Used to write the scripts and launch the code

You can [View the dataset here](https://github.com/DamilolaOwolabi/Ranking_Animation_D3js/blob/main/datasets/cleaned_billionaires(1).csv).

#### **Project Preview**
Here’s a quick preview of the animation:

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6390_Exam_1/Image/RankingAnimation.gif" title="Billionaires Animation GIF" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    Here is the GIF animation of my project.
</div>

#### **Codebase Overview**
The project is built using **Processing**. The code is divided into different files for better organization:

- **BillionairesAnimation.pde**: The main file responsible for the animation and logic. It contains the data structure for each billionaire (name, net worth, nationality, etc.). Lastly, Handles the interactive buttons (Play, Pause, Step).
- **Images**: This folder contains logos of the companies associated with the billionaires.
- **Dataset**: The CSV file that contains all the billionaire data.

[Link to the code](https://github.com/DamilolaOwolabi/Ranking_Animation_D3js/blob/main/processing_code/ranking_animation.pde)

#### **How to Run the Project**
1. Install **[Processing](https://processing.org/download/)** (https://processing.org/download/).
2. Download the dataset and logos from the repository.
3. Open the `.pde` file in Processing and run the sketch.

---

### **Links**
- **Dataset**: [cleaned_billionaires.csv](https://github.com/DamilolaOwolabi/Ranking_Animation_D3js/blob/main/datasets/cleaned_billionaires(1).csv)
- **Image Icons**: [icons used](https://github.com/DamilolaOwolabi/Ranking_Animation_D3js/tree/main/images)
- **Source Code**: [BillionairesAnimation.pde](https://github.com/DamilolaOwolabi/Ranking_Animation_D3js/blob/main/processing_code/ranking_animation.pde)

---
