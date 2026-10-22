# frozen_string_literal: true

# Site-specific build tweaks (runs on every HTML page after it's rendered):
#
# 1. Titles: gives the home page its role-based title (`home_title` in
#    _config.yml) in the browser tab, link previews (Open Graph / Twitter),
#    and capitalizes page names ("projects | ..." -> "Projects | ...").
# 2. AI assistant: adds the chat widget to every page when
#    `chatbot.endpoint` is set in _config.yml.
# 3. Navbar: the theme leaves the site name out of the navbar on the home
#    page; this adds it back so every page has the same top bar.
# 4. CV: turns the bare PDF icon next to the CV title into a labeled
#    "Download PDF" button (the theme's icon has no text for screen readers).
# 5. Page titles: marks short ones ("Projects", "CV") with .is-short so they
#    can be set very large without long project titles wrapping badly.
#
# Kept as a plugin so it doesn't require copying (and maintaining) the
# theme's own head/footer templates.

require "cgi"
require "digest"

module SiteExtras
  module_function

  def html_page?(doc)
    doc.output_ext == ".html" && doc.output.is_a?(String) && doc.output.include?("</head>")
  end

  def fix_titles(doc, site)
    out = doc.output
    current = out[%r{<title>(.*?)</title>}m, 1]
    return unless current

    title = current.gsub(/\s+/, " ").strip
    home_title = site.config["home_title"].to_s.strip
    if doc.url == "/" && !home_title.empty?
      title = home_title
    elsif title.include?(" | ")
      page, rest = title.split(" | ", 2)
      title = "#{page.sub(/\A\p{Ll}/, &:upcase)} | #{rest}"
    end

    escaped = CGI.escapeHTML(title)
    out = out.sub(%r{<title>.*?</title>}m, "<title>#{escaped}</title>")
    out = out.sub(/(<meta property="og:title" content=")[^"]*(")/, "\\1#{escaped}\\2")
    out = out.sub(/(<meta name="twitter:title" content=")[^"]*(")/, "\\1#{escaped}\\2")
    doc.output = out
  end

  def chat_widget(site)
    cfg = site.config["chatbot"] || {}
    endpoint = cfg["endpoint"].to_s.strip
    return nil if endpoint.empty? || cfg["enabled"] == false

    @widget ||= {}
    @widget[endpoint] ||= begin
      js_path = File.join(site.source, "assets/js/chatbot.js")
      version = File.exist?(js_path) ? Digest::SHA256.file(js_path).hexdigest[0, 10] : "1"
      baseurl = site.config["baseurl"].to_s
      bot = site.data["chatbot"] || {}
      attrs = {
        "data-endpoint" => endpoint,
        "data-name" => cfg["assistant_name"] || "Dammy's AI assistant",
        "data-teaser" => cfg["teaser"] || "Hi! I'm Dammy's AI assistant. Ask me about his experience, skills, or projects.",
        "data-email" => cfg["fallback_email"] || "",
        "data-avatar" => "#{baseurl}/assets/img/#{cfg['avatar'] || 'Profilepic.jpg'}",
        "data-suggestions" => Array(cfg["suggestions"]).join("|"),
        "data-teaser-delay" => (cfg["teaser_delay_seconds"] || 6).to_s,
        "data-headline" => bot["headline"].to_s,
      }.map { |k, v| %(#{k}="#{CGI.escapeHTML(v.to_s)}") }.join(" ")
      %(\n<div id="site-chat" #{attrs}></div>\n<script defer src="#{baseurl}/assets/js/chatbot.js?v=#{version}"></script>\n)
    end
  end

  def navbar_brand(doc, site)
    out = doc.output
    nav = out.index('<nav id="navbar"')
    return unless nav

    nav_end = out.index("</nav>", nav) || out.length
    return if out[nav...nav_end].include?("navbar-brand")

    toggler = out.index("<button", nav)
    return unless toggler && toggler < nav_end

    name = CGI.escapeHTML(site.config["title"].to_s)
    href = "#{site.config['baseurl']}/"
    brand = %(<a class="navbar-brand title font-weight-lighter" href="#{href}" aria-current="page">#{name}</a>\n      )
    doc.output = out.dup.insert(toggler, brand)
  end

  def cv_pdf_button(doc)
    return unless doc.url == "/cv/"

    doc.output = doc.output.sub(
      %r{<a href="([^"]+\.pdf)" target="_blank" rel="noopener noreferrer" class="float-right">\s*<i class="fa-solid fa-file-pdf"></i>\s*</a>}
    ) do
      %(<a href="#{Regexp.last_match(1)}" target="_blank" rel="noopener noreferrer" class="float-right cv-pdf-btn">) +
        %(<i class="fa-solid fa-file-pdf" aria-hidden="true"></i><span>Download PDF</span></a>)
    end
    # Same-year ranges in sections the theme renders ("2023 - 2023") read as a single year.
    doc.output = doc.output.gsub(/>\s*(\d{4}) - \1\s*</, '>\\1<')
  end

  def short_title_class(doc)
    doc.output = doc.output.sub(%r{<h1 class="post-title">\s*([^<]{1,16}?)\s*(<|</h1>)}) do
      %(<h1 class="post-title is-short">#{Regexp.last_match(1)}#{Regexp.last_match(2)})
    end
  end

  def inject_widget(doc, site)
    snippet = chat_widget(site)
    return unless snippet && doc.output.include?("</body>")
    return if doc.data["chatbot"] == false

    doc.output = doc.output.sub(%r{</body>(?![\s\S]*</body>)}, "#{snippet}</body>")
  end
end

[:pages, :documents].each do |kind|
  Jekyll::Hooks.register kind, :post_render do |doc|
    next unless SiteExtras.html_page?(doc)

    SiteExtras.fix_titles(doc, doc.site)
    SiteExtras.navbar_brand(doc, doc.site)
    SiteExtras.cv_pdf_button(doc)
    SiteExtras.short_title_class(doc)
    SiteExtras.inject_widget(doc, doc.site)
  end
end
