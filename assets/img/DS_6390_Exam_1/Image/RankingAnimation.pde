import java.util.Collections;
import java.util.HashMap;
import java.util.ArrayList;
import processing.core.PImage;

Table table;
ArrayList<Integer> years;
HashMap<Integer, ArrayList<Billionaire>> billionaires;
HashMap<String, PImage> companySymbols;
int currentIndex = 0;
ArrayList<Billionaire> top10;
ArrayList<Billionaire> previousTop10 = new ArrayList<Billionaire>();
HashMap<String, Float> previousLengths = new HashMap<String, Float>();
float lerpAmount = 0.0;
int lastTransitionTime = 0;
int transitionDelay = 2000;
boolean isPaused = false;

ArrayList<Button> buttons;

void setup() {
  size(800, 600);
  table = loadTable("C:/Users/owola/Documents/MY_COURSES/SUMMER 2024/DS 6390/Exam/Monday Meeting/cleaned_billionaires(1).csv", "header");
  if (table == null) {
    println("Table not found or could not be loaded.");
    exit();
  }
  processData();
  Collections.sort(years);
  frameRate(60);
  loadCompanySymbols();
  createButtons();
}

void draw() {
  background(240);

  if (years.size() == 0) return;

  fill(0);
  textSize(40);
  textAlign(CENTER, CENTER);
  text("Top 10 Billionaires by Year", width / 2, 15);

  int currentYear = years.get(currentIndex);
  top10 = new ArrayList<Billionaire>(billionaires.get(currentYear).subList(0, 10));

  fill(0);
  textSize(32);
  textAlign(CENTER, CENTER);
  text(currentYear, width / 2, 50);

  drawBars();
  drawButtons();

  if (!isPaused) {
    lerpAmount += 0.005;
    if (lerpAmount >= 1) {
      lerpAmount = 0.0;
      previousTop10 = new ArrayList<Billionaire>(top10);
      for (Billionaire b : top10) {
        previousLengths.put(b.name, map(b.netWorth, 0, getMaxNetWorth(), 0, width / 3));
      }
      currentIndex++;
      if (currentIndex >= years.size()) {
        currentIndex = 0;
      }
      lastTransitionTime = millis();
    }
  }
}

float getMaxNetWorth() {
  float maxWorth = 0;
  for (ArrayList<Billionaire> list : billionaires.values()) {
    for (Billionaire b : list) {
      if (b.netWorth > maxWorth) {
        maxWorth = b.netWorth;
      }
    }
  }
  return maxWorth;
}

void processData() {
  years = new ArrayList<Integer>();
  billionaires = new HashMap<Integer, ArrayList<Billionaire>>();

  for (TableRow row : table.rows()) {
    int year = row.getInt("year");
    if (!years.contains(year)) {
      years.add(year);
      billionaires.put(year, new ArrayList<Billionaire>());
    }
    float netWorth = parseNetWorth(row.getString("net_worth_cleaned"));
    String name = row.getString("name");
    String nationality = row.getString("nationality");
    String sourceWealth = row.getString("source_wealth");

    billionaires.get(year).add(new Billionaire(name, netWorth, nationality, sourceWealth));
  }

  for (int year : billionaires.keySet()) {
    billionaires.get(year).sort((b1, b2) -> Float.compare(b2.netWorth, b1.netWorth));
  }
}

float parseNetWorth(String netWorthStr) {
  netWorthStr = netWorthStr.replace("$", "").replace("B", "");
  return float(netWorthStr);
}

void drawBars() {
  if (top10.size() == 0) return;

  float maxWorth = getMaxNetWorth();
  float barWidth = width / 3;
  float barHeight = height / 12;
  float xOffset = 200;
  float yOffset = 100;

  for (int i = 0; i < top10.size(); i++) {
    Billionaire billionaire = top10.get(i);
    float previousY = yOffset + i * barHeight;
    float previousBarLength = 0;
    float previousNetWorth = 0;
    if (previousTop10 != null && previousTop10.size() > 0) {
      for (int j = 0; j < previousTop10.size(); j++) {
        if (previousTop10.get(j).name.equals(billionaire.name)) {
          previousY = yOffset + j * barHeight;
          previousBarLength = previousLengths.containsKey(billionaire.name) ? previousLengths.get(billionaire.name) : 0;
          previousNetWorth = previousTop10.get(j).netWorth;
          break;
        }
      }
    }

    float barLength = map(billionaire.netWorth, 0, maxWorth, 0, barWidth);
    float interpolatedY = lerp(previousY, yOffset + i * barHeight, lerpAmount);
    float interpolatedBarLength = lerp(previousBarLength, barLength, lerpAmount);
    float interpolatedNetWorth = lerp(previousNetWorth, billionaire.netWorth, lerpAmount);

    // Align all elements horizontally with the name
    float nameXOffset = 10;
    float barXOffset = xOffset + 10;
    float valueXOffset = xOffset + interpolatedBarLength + 20;
    float logoXOffset = valueXOffset + 60;

    fill(0);
    textSize(16);
    textAlign(LEFT, CENTER);
    text(billionaire.name, nameXOffset, interpolatedY);

    drawFlag(barXOffset, interpolatedY - barHeight / 2, interpolatedBarLength, barHeight / 2, billionaire.nationality);

    fill(0);
    textSize(16);
    textAlign(LEFT, CENTER);
    text("$" + nf(interpolatedNetWorth, 0, 1) + "B", valueXOffset, interpolatedY);

    PImage symbol = companySymbols.get(billionaire.sourceWealth);
    if (symbol != null) {
      float aspectRatio = (float)symbol.width / symbol.height;
      float symbolHeight = barHeight / 2;
      float symbolWidth = symbolHeight * aspectRatio;
      image(symbol, logoXOffset, interpolatedY - symbolHeight / 2, symbolWidth, symbolHeight);
    }

    if (mouseX > barXOffset && mouseX < barXOffset + interpolatedBarLength &&
        mouseY > interpolatedY - barHeight / 2 && mouseY < interpolatedY + barHeight / 2) {
      fill(255, 255, 255, 200);
      rect(mouseX + 10, mouseY - 25, 200, 50);
      fill(0);
      textSize(12);
      textAlign(LEFT, TOP);
      text("Name: " + billionaire.name + "\nNet Worth: $" + nf(billionaire.netWorth, 0, 1) + "B\nNationality: " + billionaire.nationality, mouseX + 15, mouseY - 20);
    }
  }
}

void drawFlag(float x, float y, float w, float h, String nationality) {
  if (nationality.equals("United States")) {
    drawUSAFlag(x, y, w, h);
  } else if (nationality.equals("France")) {
    drawFranceFlag(x, y, w, h);
  } else if (nationality.equals("Japan")) {
    drawJapanFlag(x, y, w, h);
  } else if (nationality.equals("India")) {
    drawIndiaFlag(x, y, w, h);
  } else if (nationality.equals("Spain")) {
    drawSpainFlag(x, y, w, h);
  } else if (nationality.equals("Mexico")) {
    drawMexicoFlag(x, y, w, h);
  } else if (nationality.equals("Hong Kong")) {
    drawHongKongFlag(x, y, w, h);
  } else if (nationality.equals("Brazil")) {
    drawBrazilFlag(x, y, w, h);
  } else if (nationality.equals("Sweden")) {
    drawSwedenFlag(x, y, w, h);
  } else if (nationality.equals("Germany")) {
    drawGermanyFlag(x, y, w, h);
  } else if (nationality.equals("Russia")) {
    drawRussiaFlag(x, y, w, h);
  } else if (nationality.equals("Canada")) {
    drawCanadaFlag(x, y, w, h);
  } else if (nationality.equals("Saudi Arabia")) {
    drawSaudiArabiaFlag(x, y, w, h);
  } else {
    fill(100); // Default color if nationality is not found
    rect(x, y, w, h);
  }
}

void drawUSAFlag(float x, float y, float w, float h) {
  float stripeHeight = h / 13;
  for (int i = 0; i < 13; i++) {
    if (i % 2 == 0) {
      fill(179, 25, 66); // Red
    } else {
      fill(255); // White
    }
    rect(x, y + i * stripeHeight, w, stripeHeight);
  }
  fill(60, 59, 110); // Blue
  rect(x, y, w * 2 / 5, h * 7 / 13);
}

void drawFranceFlag(float x, float y, float w, float h) {
  fill(0, 85, 164); // Blue
  rect(x, y, w / 3, h);
  fill(255); // White
  rect(x + w / 3, y, w / 3, h);
  fill(239, 65, 53); // Red
  rect(x + 2 * w / 3, y, w / 3, h);
}

void drawJapanFlag(float x, float y, float w, float h) {
  fill(255); // White
  rect(x, y, w, h);
  fill(188, 0, 45); // Red
  ellipse(x + w / 2, y + h / 2, h * 3 / 5, h * 3 / 5);
}

void drawIndiaFlag(float x, float y, float w, float h) {
  fill(255, 153, 51); // Saffron
  rect(x, y, w, h / 3);
  fill(255); // White
  rect(x, y + h / 3, w, h / 3);
  fill(19, 136, 8); // Green
  rect(x, y + 2 * h / 3, w, h / 3);
  fill(0, 0, 128); // Blue (Ashoka Chakra)
  ellipse(x + w / 2, y + h / 2, h / 4, h / 4);
}

void drawSpainFlag(float x, float y, float w, float h) {
  fill(198, 12, 48); // Red
  rect(x, y, w, h / 4);
  fill(255, 209, 0); // Yellow
  rect(x, y + h / 4, w, h / 2);
  fill(198, 12, 48); // Red
  rect(x, y + 3 * h / 4, w, h / 4);
}

void drawMexicoFlag(float x, float y, float w, float h) {
  fill(0, 104, 71); // Green
  rect(x, y, w / 3, h);
  fill(255); // White
  rect(x + w / 3, y, w / 3, h);
  fill(206, 17, 38); // Red
  rect(x + 2 * w / 3, y, w / 3, h);
}

void drawHongKongFlag(float x, float y, float w, float h) {
  fill(223, 37, 42); // Red
  rect(x, y, w, h);
  fill(255); // White
  float petalLength = h / 5;
  float petalWidth = w / 15;
  for (int i = 0; i < 5; i++) {
    pushMatrix();
    translate(x + w / 2, y + h / 2);
    rotate(TWO_PI * i / 5);
    ellipse(0, -h / 4, petalWidth, petalLength);
    popMatrix();
  }
}

void drawBrazilFlag(float x, float y, float w, float h) {
  fill(0, 156, 59); // Green
  rect(x, y, w, h);
  fill(255, 223, 0); // Yellow
  beginShape();
  vertex(x + w / 2, y);
  vertex(x + w, y + h / 2);
  vertex(x + w / 2, y + h);
  vertex(x, y + h / 2);
  endShape(CLOSE);
  fill(0, 39, 118); // Blue
  ellipse(x + w / 2, y + h / 2, h / 2, h / 2);
}

void drawSwedenFlag(float x, float y, float w, float h) {
  fill(0, 106, 167); // Blue
  rect(x, y, w, h);
  fill(254, 204, 0); // Yellow
  rect(x + w / 3 - w / 30, y, w / 15, h);
  rect(x, y + h / 2 - h / 30, w, h / 15);
}

void drawGermanyFlag(float x, float y, float w, float h) {
  fill(0, 0, 0); // Black
  rect(x, y, w, h / 3);
  fill(221, 0, 0); // Red
  rect(x, y + h / 3, w, h / 3);
  fill(255, 206, 0); // Yellow
  rect(x, y + 2 * h / 3, w, h / 3);
}

void drawRussiaFlag(float x, float y, float w, float h) {
  fill(255, 255, 255); // White
  rect(x, y, w, h / 3);
  fill(0, 57, 166); // Blue
  rect(x, y + h / 3, w, h / 3);
  fill(213, 43, 30); // Red
  rect(x, y + 2 * h / 3, w, h / 3);
}

void drawCanadaFlag(float x, float y, float w, float h) {
  fill(255, 0, 0); // Red
  rect(x, y, w / 4, h);
  rect(x + 3 * w / 4, y, w / 4, h);
  fill(255); // White
  rect(x + w / 4, y, w / 2, h);
  fill(255, 0, 0); // Red (Maple Leaf)
  beginShape();
  vertex(x + w / 2, y + h / 6);
  vertex(x + w / 2 + w / 20, y + h / 4);
  vertex(x + w / 2 + w / 10, y + h / 4);
  vertex(x + w / 2 + w / 20, y + h / 2);
  vertex(x + w / 2 + w / 10, y + h * 2 / 3);
  vertex(x + w / 2, y + h * 2 / 3 + h / 10);
  vertex(x + w / 2 - w / 10, y + h * 2 / 3);
  vertex(x + w / 2 - w / 20, y + h / 2);
  vertex(x + w / 2 - w / 10, y + h / 4);
  vertex(x + w / 2 - w / 20, y + h / 4);
  endShape(CLOSE);
}

void drawSaudiArabiaFlag(float x, float y, float w, float h) {
  fill(0, 109, 63); // Green
  rect(x, y, w, h);
  fill(255); // White (Sword)
  beginShape();
  vertex(x + w / 5, y + 3 * h / 4);
  vertex(x + 4 * w / 5, y + 3 * h / 4);
  vertex(x + 4 * w / 5, y + 3 * h / 4 - h / 20);
  vertex(x + w / 3, y + 3 * h / 4 - h / 20);
  endShape(CLOSE);
}


void loadCompanySymbols() {
  companySymbols = new HashMap<String, PImage>();
  companySymbols.put("Amazon", loadImage("amazon_logo.png"));
  companySymbols.put("Tesla, SpaceX", loadImage("tesla_spacex_logo.png"));
  companySymbols.put("LVMH", loadImage("lvmh_logo.png"));
  companySymbols.put("Microsoft", loadImage("microsoft_logo.png"));
  companySymbols.put("Facebook", loadImage("facebook_logo.png"));
  companySymbols.put("Berkshire Hathaway", loadImage("berkshire_hathaway_logo.png"));
  companySymbols.put("Oracle Corporation", loadImage("oracle_logo.png"));
  companySymbols.put("Alphabet Inc.", loadImage("alphabet_inc._logo.png"));
  companySymbols.put("Reliance Industries", loadImage("reliance_industries_logo.png"));
  companySymbols.put("Inditex, Zara", loadImage("inditex_zara_logo.png"));
  companySymbols.put("Walmart", loadImage("walmart_logo.png"));
  companySymbols.put("América Móvil, Grupo Carso", loadImage("américa_móvil_grupo_carso_logo.png"));
  companySymbols.put("Diversified", loadImage("diversified_logo.png"));
  companySymbols.put("Bloomberg L.P.", loadImage("bloomberg_l.p._logo.png"));
  companySymbols.put("Koch Industries", loadImage("koch_industries_logo.png"));
  companySymbols.put("Inditex", loadImage("inditex_logo.png"));
  companySymbols.put("L'Oreal", loadImage("l'oreal_logo.png"));
  companySymbols.put("Las Vegas Sands", loadImage("las_vegas_sands_logo.png"));
  companySymbols.put("Inditex Group", loadImage("inditex_group_logo.png"));
  companySymbols.put("Cheung Kong Holdings", loadImage("cheung_kong_holdings_logo.png"));
  companySymbols.put("L'Oréal", loadImage("l'oréal_logo.png"));
  companySymbols.put("LVMH MoÁ«t Hennessy • Louis Vuitton", loadImage("lvmh_moá«t_hennessy_•_louis_vuitton_logo.png"));
  companySymbols.put("EBX Group", loadImage("ebx_group_logo.png"));
  companySymbols.put("H&M", loadImage("handm_logo.png"));
  companySymbols.put("Aldi", loadImage("aldi_logo.png"));
  companySymbols.put("Arcelor Mittal", loadImage("arcelor_mittal_logo.png"));
  companySymbols.put("Aldi SÁ¼d", loadImage("aldi_sá¼d_logo.png"));
  companySymbols.put("IKEA", loadImage("ikea_logo.png"));
  companySymbols.put("Aldi Nord, Trader Joe's", loadImage("aldi_nord_trader_joe's_logo.png"));
  companySymbols.put("Anil Dhirubhai Ambani Group", loadImage("anil_dhirubhai_ambani_group_logo.png"));
  companySymbols.put("DLF Group", loadImage("dlf_group_logo.png"));
  companySymbols.put("Rusal", loadImage("rusal_logo.png"));
  companySymbols.put("Cheung Kong Holdings, Hutchison Whampoa", loadImage("cheung_kong_holdings_hutchison_whampoa_logo.png"));
  companySymbols.put("Thomson Corporation", loadImage("thomson_corporation_logo.png"));
  companySymbols.put("Mittal Steel Company", loadImage("mittal_steel_company_logo.png"));
  companySymbols.put("Kingdom Holding Company", loadImage("kingdom_holding_company_logo.png"));
  companySymbols.put("Cheung Kong Group, Hutchison Whampoa", loadImage("cheung_kong_group_hutchison_whampoa_logo.png"));
  companySymbols.put("Wal-Mart", loadImage("wal-mart_logo.png"));
  companySymbols.put("Softbank Capital, SoftBank Mobile", loadImage("softbank_capital_softbank_mobile_logo.png"));
  companySymbols.put("Dell", loadImage("dell_logo.png"));
  companySymbols.put("The Thomson Corporation", loadImage("the_thomson_corporation_logo.png"));
  // Add more companies and their logos here
}


void createButtons() {
  buttons = new ArrayList<Button>();
  float buttonWidth = 80;
  float buttonHeight = 30;
  float xCenter = width / 2 - buttonWidth / 2;
  float yPosition = height - 40;
  buttons.add(new Button("Pause", xCenter - 100, yPosition, buttonWidth, buttonHeight, () -> isPaused = true));
  buttons.add(new Button("Play", xCenter, yPosition, buttonWidth, buttonHeight, () -> isPaused = false));
  buttons.add(new Button("Step", xCenter + 100, yPosition, buttonWidth, buttonHeight, () -> {
    isPaused = true;
    lerpAmount = 0.0;
    previousTop10 = new ArrayList<Billionaire>(top10);
    currentIndex++;
    if (currentIndex >= years.size()) {
      currentIndex = 0;
    }
    lastTransitionTime = millis();
  }));
}

void drawButtons() {
  for (Button button : buttons) {
    button.display();
  }
}

void mousePressed() {
  for (Button button : buttons) {
    if (button.isMouseOver()) {
      button.onClick.run();
    }
  }
}

class Button {
  String label;
  float x, y, w, h;
  Runnable onClick;

  Button(String label, float x, float y, float w, float h, Runnable onClick) {
    this.label = label;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.onClick = onClick;
  }

  void display() {
    fill(180);
    rect(x, y, w, h, 5); // Rounded corners for better design
    fill(0);
    textSize(16);
    textAlign(CENTER, CENTER);
    text(label, x + w / 2, y + h / 2);
  }

  boolean isMouseOver() {
    return mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
  }
}

class Billionaire {
  String name;
  float netWorth;
  String nationality;
  String sourceWealth;

  Billionaire(String name, float netWorth, String nationality, String sourceWealth) {
    this.name = name;
    this.netWorth = netWorth;
    this.nationality = nationality;
    this.sourceWealth = sourceWealth;
  }
}
