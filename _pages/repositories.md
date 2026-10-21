---
layout: page
permalink: /repositories/
title: Repositories
description: The code behind my projects. Everything else is on my GitHub profile.
nav: true
nav_order: 6
---

<div class="case-links">
<a class="hero-btn hero-btn-secondary" href="https://github.com/{{ site.data.socials.github_username }}" target="_blank" rel="noopener"><i class="fa-brands fa-github" aria-hidden="true"></i><span>View my GitHub profile</span></a>
</div>

{% if site.data.repositories.github_repos %}

<div class="repositories d-flex flex-wrap flex-md-row flex-column justify-content-between align-items-center">
  {% for repo in site.data.repositories.github_repos %}
    {% include repository/repo.liquid repository=repo %}
  {% endfor %}
</div>
{% endif %}
