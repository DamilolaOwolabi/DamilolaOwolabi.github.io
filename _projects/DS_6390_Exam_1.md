---
layout: page
title: Billionaire Rankings, Animated
description: A Processing animation of the world’s 10 richest people from 2000 to 2021, with flags and company logos for context.
img: assets/img/projects/covers/billionaire-rankings.jpg
importance: 4
category: school
tools: [Processing.js, Animation, Data viz]
---

<dl class="case-glance">
  <div><dt>Context</dt><dd>SMU MS in Data Science, DS 6390 Data Visualization exam</dd></div>
  <div><dt>Data</dt><dd>Top 10 billionaires by year, 2000 to 2021</dd></div>
  <div><dt>Stack</dt><dd>Processing 4.3</dd></div>
</dl>

<div class="case-links">
<a class="hero-btn hero-btn-secondary" href="https://github.com/DamilolaOwolabi/Ranking_Animation_D3js" target="_blank" rel="noopener"><i class="fa-brands fa-github" aria-hidden="true"></i><span>Code and data on GitHub</span></a>
</div>

## Project Overview

This project visualizes the top 10 billionaires by net worth over different years using **Processing.js**. The animation provides a dynamic, visual comparison of billionaires’ net worth, including nationality and the source of their wealth through flags and company logos.

## Purpose

- **Visualize billionaire data**: Display the top 10 billionaires from various years, highlighting changes in net worth and rankings.
- **Animate transitions**: Show smooth animations between years to give a clearer understanding of how billionaire rankings have evolved.
- **Add context**: Include visual elements like country flags and company logos to make the data more meaningful.

## Features

- Animated bar chart representing the net worth of billionaires.
- Interactive controls (Play, Pause, Step through years).
- Company logos and national flags for additional context.
- Smooth transitions between year-to-year changes in rankings.

## Dataset

The dataset used for this animation contains:

- **Year**: The year of the data.
- **Billionaire**: Name of the billionaire.
- **Net Worth**: Billionaire's net worth in billions of dollars (USD).
- **Nationality**: The billionaire’s country of origin.
- **Source of Wealth**: The main source of wealth (e.g., company).

## Tools Used

- **Processing 4.3**: Used to write the scripts and launch the code

You can [View the dataset here](<https://github.com/DamilolaOwolabi/Ranking_Animation_D3js/blob/main/datasets/cleaned_billionaires(1).csv>).

## Project Preview

Here’s a quick preview of the animation:

<figure class="video-figure">
  <video controls muted loop playsinline preload="metadata" poster="{{ '/assets/img/DS_6390_Exam_1/Image/RankingAnimation_poster.jpg' | relative_url }}" aria-label="Animated bar chart of the top 10 billionaires by net worth, 2000 to 2021">
    <source src="{{ '/assets/img/DS_6390_Exam_1/Image/RankingAnimation.mp4' | relative_url }}" type="video/mp4">
  </video>
</figure>

<div class="caption">
    The full animation, 2000 to 2021 (1 minute 42 seconds).
</div>

## Codebase Overview

The project is built using **Processing**. The code is divided into different files for better organization:

- **BillionairesAnimation.pde**: The main file responsible for the animation and logic. It contains the data structure for each billionaire (name, net worth, nationality, etc.). Lastly, Handles the interactive buttons (Play, Pause, Step).
- **Images**: This folder contains logos of the companies associated with the billionaires.
- **Dataset**: The CSV file that contains all the billionaire data.

[Link to the code](https://github.com/DamilolaOwolabi/Ranking_Animation_D3js/blob/main/processing_code/ranking_animation.pde)

## How to Run the Project

1. Install **[Processing](https://processing.org/download/)** (https://processing.org/download/).
2. Download the dataset and logos from the repository.
3. Open the `.pde` file in Processing and run the sketch.

---

## Links

- **Dataset**: [cleaned_billionaires.csv](<https://github.com/DamilolaOwolabi/Ranking_Animation_D3js/blob/main/datasets/cleaned_billionaires(1).csv>)
- **Image Icons**: [icons used](https://github.com/DamilolaOwolabi/Ranking_Animation_D3js/tree/main/images)
- **Source Code**: [BillionairesAnimation.pde](https://github.com/DamilolaOwolabi/Ranking_Animation_D3js/blob/main/processing_code/ranking_animation.pde)

---
