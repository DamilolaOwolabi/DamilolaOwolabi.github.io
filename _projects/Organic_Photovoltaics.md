---
layout: page
title: Understanding the Mechanical Properties of Thiolene Blended Active Layer Films for Organic Photovoltaics
description: This research project focuses on improving the mechanical properties of organic photovoltaics (OPVs) by blending thiolene crosslinked networks with the active layer.
img: assets/img/Organic_Photovoltaics/thumbnail.jpg
importance: 2
category: other
tools: [Research, Python, Excel, Publication]
---

<dl class="case-glance">
  <div><dt>Role</dt><dd>Research intern; fabrication, testing, and data analysis</dd></div>
  <div><dt>Where</dt><dd>Verduzco Lab, Chemical and Biomolecular Engineering, Rice University</dd></div>
  <div><dt>Program</dt><dd>REEMS summer research program (NSF Grant DMR 1460564)</dd></div>
  <div><dt>Stack</dt><dd>Lab fabrication and testing, Excel, Python</dd></div>
  <div><dt>Outcome</dt><dd>Co-author, <em>Advanced Optical Materials</em> (2020)</dd></div>
</dl>

<a class="hero-btn hero-btn-secondary" href="https://doi.org/10.1002/adom.202000516" target="_blank" rel="noopener"><i class="fa-solid fa-book-open" aria-hidden="true"></i><span>Read the paper</span></a>

## The problem

Organic photovoltaics (OPVs) are thin, flexible, and cheap to make, which makes them attractive for wearables and portable power. Their weakness is mechanical: the active layer cracks under strain, which limits real-world use.

## Our approach

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/Organic_Photovoltaics/Presentation.PNG" title="Poster presentation" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

We blended a **thiol-ene crosslinked network** into the P3HT:PCBM active layer and measured how the mechanics changed as the thiol-ene percentage increased.

- **Fabrication.** Blend P3HT (donor) and PCBM (acceptor), coat the film, then UV-crosslink a PETMP and PAE thiol-ene network inside it.
- **Calibration.** Calibrated the syringe pump (volumetric rate) and the load cell (voltage versus applied weight) before testing.
- **Testing.** Floating-film tests held films in PDMS and stretched them to measure stress, elastic modulus, and crack onset strain.
- **Analysis.** I ran statistical analysis of the results in Excel and Python, working from over 250 data points.

## Results

- **Elastic modulus** decreased linearly as thiol-ene content increased, so the films became more compliant.
- **Crack onset strain** increased sharply (roughly exponentially) with more thiol-ene, so films stretched further before cracking.
- Stress on the active layer went down without hurting its electronic function.
- The work contributed to a peer-reviewed paper in _Advanced Optical Materials_ (2020), where I'm a co-author.

## What I'd do next

- Simulate thiol-ene interactions at the molecular level.
- Run matched tests on pristine P3HT and PCBM films as controls.
- Find the thiol-ene content that best balances mechanical and electronic performance.

## Acknowledgments

Dr. Rafael Verduzco (Rice University), the REEMS program at Houston Community College, and NSF Grant DMR 1460564. See also Chem. Mater. 2018, 30, 28, 8314–8321 ([DOI](https://doi.org/10.1021/acs.chemmater.8b03791)).
