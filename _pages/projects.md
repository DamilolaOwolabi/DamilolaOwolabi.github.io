---
layout: page
title: projects
permalink: /projects/
description: Data science, engineering, and research work, from predictive models to interactive visualizations.
nav: true
nav_order: 1
display_categories: [school, fun, other]
horizontal: false
featured: [Cotton_Drone_Analysis, Organic_Photovoltaics, DS6371_Final_Project]
---

<!-- pages/projects.md -->

<!-- Featured projects (pick them with `featured:` in the front matter above) -->
{% if page.featured %}
<section class="featured-projects" aria-labelledby="featured-heading">
  <h2 class="section-label" id="featured-heading">Featured</h2>
  <div class="featured-grid">
  {% for name in page.featured %}
    {% assign fp_matches = site.projects | where_exp: "p", "p.path contains name" %}
    {% assign fp = fp_matches | first %}
    {% if fp %}
    <a class="featured-card" href="{% if fp.redirect %}{{ fp.redirect }}{% else %}{{ fp.url | relative_url }}{% endif %}">
      {% if fp.img %}
      <div class="featured-media">
        {% include figure.liquid loading="eager" path=fp.img sizes="(min-width: 768px) 420px, 92vw" alt=fp.title class="featured-img" %}
      </div>
      {% endif %}
      <div class="featured-body">
        <h3 class="featured-title">{{ fp.title }}</h3>
        <p class="featured-desc">{{ fp.description | truncate: 150 }}</p>
        {% if fp.tools %}
        <ul class="tool-chips" aria-label="Tools used">
          {% for tool in fp.tools limit: 5 %}<li>{{ tool }}</li>{% endfor %}
        </ul>
        {% endif %}
        <span class="featured-link">Read case study <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
      </div>
    </a>
    {% endif %}
  {% endfor %}
  </div>
</section>
<h2 class="section-label">All projects</h2>
{% endif %}

<div class="projects">
{% if site.enable_project_categories and page.display_categories %}
  <!-- Display categorized projects -->
  {% for category in page.display_categories %}
  <a id="{{ category }}" href=".#{{ category }}">
    <h2 class="category">{{ category }}</h2>
  </a>
  {% assign categorized_projects = site.projects | where: "category", category %}
  {% assign sorted_projects = categorized_projects | sort: "importance" %}
  <!-- Generate cards for each project -->
  {% if page.horizontal %}
  <div class="container">
    <div class="row row-cols-1 row-cols-md-2">
    {% for project in sorted_projects %}
      {% include projects_horizontal.liquid %}
    {% endfor %}
    </div>
  </div>
  {% else %}
  <div class="row row-cols-1 row-cols-md-3">
    {% for project in sorted_projects %}
      {% include projects.liquid %}
    {% endfor %}
  </div>
  {% endif %}
  {% endfor %}

{% else %}

<!-- Display projects without categories -->

{% assign sorted_projects = site.projects | sort: "importance" %}

  <!-- Generate cards for each project -->

{% if page.horizontal %}

  <div class="container">
    <div class="row row-cols-1 row-cols-md-2">
    {% for project in sorted_projects %}
      {% include projects_horizontal.liquid %}
    {% endfor %}
    </div>
  </div>
  {% else %}
  <div class="row row-cols-1 row-cols-md-3">
    {% for project in sorted_projects %}
      {% include projects.liquid %}
    {% endfor %}
  </div>
  {% endif %}
{% endif %}
</div>
