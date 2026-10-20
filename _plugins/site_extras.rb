# frozen_string_literal: true

# Site-specific build tweaks (runs on every HTML page after it's rendered):
#
# 1. Titles: gives the home page its role-based title (`home_title` in
#    _config.yml) in the browser tab, link previews (Open Graph / Twitter),
#    and capitalizes page names ("projects | ..." -> "Projects | ...").
# 2. AI assistant: adds the chat widget to every page when
#    `chatbot.endpoint` is set in _config.yml.
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
    SiteExtras.inject_widget(doc, doc.site)
  end
end
