---
layout: page
title: Projects
permalink: /projects/
description: Data science, engineering, and research work, from predictive models to interactive visualizations.
nav: true
nav_order: 1
# Order of category sections. Any other category a project uses is added at the end automatically.
display_categories: [work, research, school, personal, other]
---

<!-- pages/projects.md
  Projects live in _projects/ (one file each). To feature a project at the top,
  set `featured: true` in its front matter; `importance` sets the order (lower first).
  See HOW-TO-EDIT.md for the full guide. -->

<div class="project-filter" hidden></div>

{% assign featured_projects = site.projects | where: "featured", true | sort: "importance" %}
{% if featured_projects.size > 0 %}

<section class="featured-projects" data-reveal aria-labelledby="featured-heading">
  <h2 class="section-label" id="featured-heading">Featured</h2>
  <div class="featured-grid">
  {% for fp in featured_projects limit: 3 %}
    <a class="featured-card" data-tools="{{ fp.tools | join: '|' }}" data-name="{{ fp.title | escape }}" href="{% if fp.redirect %}{{ fp.redirect }}{% else %}{{ fp.url | relative_url }}{% endif %}">
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
        <span class="featured-link">{% if fp.redirect %}Visit project{% else %}Read case study{% endif %} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
      </div>
    </a>
  {% endfor %}
  </div>
</section>
<h2 class="section-label all-projects-label">More projects</h2>
{% endif %}
{% comment %} Projects already shown in Featured are not repeated below. {% endcomment %}
{% assign featured_urls = featured_projects | slice: 0, 3 | map: "url" %}

{% assign used_categories = site.projects | map: "category" | compact | uniq %}
{% assign category_order = page.display_categories %}
{% for c in used_categories %}
{% unless category_order contains c %}{% assign category_order = category_order | push: c %}{% endunless %}
{% endfor %}
{% assign uncategorized = site.projects | where_exp: "p", "p.category == nil" | sort: "importance" %}

<div class="projects">
  {% for category in category_order %}
    {% assign in_category = site.projects | where: "category", category | sort: "importance" %}
    {% assign categorized_projects = "" | split: "" %}
    {% for p in in_category %}{% unless featured_urls contains p.url %}{% assign categorized_projects = categorized_projects | push: p %}{% endunless %}{% endfor %}
    {% if categorized_projects.size > 0 %}
  <a id="{{ category }}" href=".#{{ category }}">
    <h2 class="category">{{ category }}</h2>
  </a>
  <div class="row row-cols-1 row-cols-md-3">
    {% for project in categorized_projects %}
      {% include projects.liquid %}
    {% endfor %}
  </div>
    {% endif %}
  {% endfor %}
  {% if uncategorized.size > 0 %}
  <a id="more" href=".#more">
    <h2 class="category">more</h2>
  </a>
  <div class="row row-cols-1 row-cols-md-3">
    {% for project in uncategorized %}
      {% include projects.liquid %}
    {% endfor %}
  </div>
  {% endif %}
</div>

<script defer src="{{ '/assets/js/site.js' | relative_url | bust_file_cache }}"></script>
