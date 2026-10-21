---
layout: page
title: Cotton Drone Analysis
description: "Senior design project I led: a $400 drone and Raspberry Pi system that photographs cotton fields and uses ML to estimate crop health."
img: assets/img/Cotton_Drone_Analysis/cotton_drone.jpg
importance: 1
category: school
tools: [Python, Django, Raspberry Pi, Google Cloud, Machine learning]
featured: true
---

<dl class="case-glance">
  <div><dt>Role</dt><dd>Project lead</dd></div>
  <div><dt>Team</dt><dd>Four Texas A&amp;M engineering students</dd></div>
  <div><dt>Context</dt><dd>Texas A&amp;M senior design (ECEN 403/404)</dd></div>
  <div><dt>Stack</dt><dd>Python, Django, Raspberry Pi, Google Cloud, machine learning</dd></div>
  <div><dt>Budget</dt><dd>$400, excluding the drone</dd></div>
</dl>

{% comment %} The "Read the final report" button appears automatically once the report is uploaded to assets/pdf/ with this exact name. {% endcomment %}
{% assign report = site.static_files | where: "path", "/assets/pdf/Cotton_Drone_Final_Report.pdf" | first %}
{% if report %}
<a class="hero-btn hero-btn-secondary" href="{{ report.path | relative_url }}" target="_blank" rel="noopener"><i class="fa-solid fa-file-pdf" aria-hidden="true"></i><span>Read the final report</span></a>
{% endif %}

## The problem

Monitoring cotton fields by hand is slow, labor-intensive, and error-prone, and the precision-agriculture tools that automate it are often priced for large operations. We wanted a low-cost system that a smaller farm could use to see crop health and plan the harvest.

## Our approach

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/Cotton_Drone_Analysis/PowerPoint_Presentation-1.png" alt="Cotton Drone Analysis senior design poster" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

- **Drone imaging.** A Tarot 650 Pro drone carrying a Raspberry Pi 3B, Pi Camera V2, and GPS module flies a programmed path and photographs cotton fields of up to 10 acres.
- **Machine learning.** Models trained on four years of cotton field data estimate crop metrics such as canopy height, canopy cover, and a green index, which feed yield and harvest-timing predictions.
- **Web app.** A Django application lets a farmer set GPS coordinates and parameters, then view reports and interactive charts.
- **Cloud.** Images and results are stored and processed in Google Cloud Storage so users can upload and access data securely.

## Results

- An end-to-end prototype: flight, image capture, cloud storage, ML analysis, and a farmer-facing web report.
- Built within a $400 hardware budget (excluding the drone), keeping it within reach of smaller farms.
- I led the team and the project from design through the final report and poster presentation.

## Limitations and what I'd do next

- The models are trained for cotton only; extending to other crops is the obvious next step.
- Wind, rain, and battery life limit flights; weather-aware flight planning and autonomous charging would help.
- Setup still needs some technical knowledge; a simpler onboarding flow would make it farmer-ready.

## Tools

Python · Django · HTML/CSS · Raspberry Pi · Tarot drone · Google Cloud Storage · machine learning · weather APIs
