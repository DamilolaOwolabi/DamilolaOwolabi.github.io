---
layout: page
title: Machine Learning Lab, One App per Week
description: "13 interactive apps, one per week of DS 7333, each built around a question I asked that week. Real results from my course notebooks where they exist."
img: assets/img/projects/covers/ds7333-ml-lab.jpg
importance: 1
category: school
tools: [JavaScript, Machine learning, scikit-learn, XGBoost, Neural networks, Data viz]
---

<dl class="case-glance">
  <div><dt>Context</dt><dd>SMU MS in Data Science, DS 7333</dd></div>
  <div><dt>Scope</dt><dd>13 weeks: regularization through neural networks and ensembles</dd></div>
  <div><dt>Data</dt><dd>Breast cancer and digits datasets from my notebooks, plus simulations</dd></div>
  <div><dt>Stack</dt><dd>Plain JavaScript and canvas; results precomputed with scikit-learn and XGBoost</dd></div>
</dl>

<div class="case-links">
<a class="hero-btn hero-btn-secondary" href="#ml-lab"><i class="fa-solid fa-sliders" aria-hidden="true"></i><span>Open the lab</span></a>
<a class="hero-btn hero-btn-secondary" href="https://github.com/DamilolaOwolabi/DS_7333" target="_blank" rel="noopener"><i class="fa-brands fa-github" aria-hidden="true"></i><span>Notes and notebooks on GitHub</span></a>
</div>

## The idea

Each week of DS 7333 I submitted questions on that week's lectures before the live session. This page turns each week into a small app that answers my own question by letting you change the inputs and watch the model respond. Pick a week below. Everything runs in your browser.

<div id="ml-lab" class="ml-lab" data-base="{{ site.baseurl }}">
  <nav class="lab-weeks" aria-label="Course weeks"></nav>
  <div class="lab-stage" id="lab-stage" aria-live="polite"></div>
</div>

## What's real and what's simulated

- **Real results.** Weeks 2 and 3 use the breast cancer data (569 tumors) from my logistic regression notebook. Weeks 6, 7 and 8 use the digits data (1,797 images) with the same splits as my class work: Naive Bayes variants against logistic regression, random forest and bagging accuracy by number of trees, and XGBoost accuracy for 20 depth and learning-rate settings over 60 boosting rounds. These were computed with scikit-learn and XGBoost and saved as a small data file.
- **Trained live.** The Week 3 logistic model, the Week 9 kernel SVM, the Week 10 gradient descent paths and the Week 11 neural network all train in your browser from scratch, written without ML libraries.
- **Simulated.** Missing-data mechanisms (Week 4), Bayes rule (Week 6) and ensemble voting (Week 14) use generated data so you can control the true answer.

## Results

- **Regularization is a model choice, not a default.** On the breast cancer data, L1 at λ ≈ 4.6 keeps 11 of the 30 features and still scores 97.5% in cross-validation, within a point of L2's 98.4% with every feature.
- **More trees stop paying off quickly.** The random forest on digits reaches within half a point of its best accuracy (94.2%) by 35 trees.
- **Early stopping is the cheapest tuning.** All 20 XGBoost settings get within half a point of their best test accuracy before round 60, and the deeper, faster-learning ones by round 9 to 20.
- **The discriminative model won.** Logistic regression (95.3%) beat every Naive Bayes variant on digits (83.3% to 91.3%).

## Tools

JavaScript · HTML canvas · Python · scikit-learn · XGBoost · NumPy

<script defer src="{{ '/assets/js/ds7333-lab.js' | relative_url | bust_file_cache }}"></script>
