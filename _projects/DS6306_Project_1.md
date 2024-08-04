---
layout: page
title: Budweiser EDA
description: The purpose of the project is to analyse the IBU and ABV % of different beers and breweries from different US state using R.
img: assets/img/DS_6306_Project1/Thunbnails/budweiser.jpeg
importance: 3
category: school
---


Please try out my interactive Rshinyapp to experience my model’s prediction rate : [RShiny](https://github.com/DamilolaOwolabi/DS-6306-PROJECT-1)

Here is the link to other files related to the project in my GitHub Repository: [GitHub](https://github.com/DamilolaOwolabi/DS-6371-Project)


<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        <iframe width="560" height="315" src="https://www.youtube.com/embed/5oXWlK6q3AU?si=THH2m7MM1Voio0PE" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
    </div>
</div>

<div class="caption">
    Here is the Youtube Video of my presentation.
</div>




# Introduction

Good afternoon Mr. Whitworth and Mr. Tennenbaum. We are here today to present the findings from the questions presented to our team of Data Scientist. We will answer the nine questions provided ahead of time with our analysis and visualuations, as well as highlighting any key observations that came up during our review. With that, let us get started as we’re excited to share with you the breakdown of our findings.


#### Libraries/Packages used

      --- R
      #install.packages("tidyverse")
      #install.packages("ggplot2")
      #install.packages("GGally")
      #install.packages("dplyr")
      #install.packages("maps")
      #install.packages("mapsproj")
      library(ggplot2)
      library(tidyverse)
      library(GGally)
      library(dplyr)
      library(class)
      library(caret)
      library(e1071)
      library(maps)
      library(mapproj)
      ---


#### Agenda 1a: Distribution by State

Loaded files and confirm, how many breweries are located in each state?

      --- R
    #summary(Breweries) #check the type
    
    mean_count <- mean(Breweries$n) #create a column mean_count for the reference line
        
    Breweries %>% group_by(State) %>% summarize(n = n()) %>% ggplot(aes(x = State, y = n, fill = State)) +
      geom_bar(stat = "identity") + theme(legend.position = "none") + geom_text(aes(label = n, y = n +1.5)) +
      ggtitle("Count of Breweries by State") + ylab("Count of Breweries") + xlab("State") + 
      theme(axis.text.x = element_text(angle = 90, hjust = 1)) +
      geom_hline(yintercept = mean_count, linetype = "dotted", color = "red") # to show the mean. #ffh
      ---
      
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic1.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    Plot of Count of Breweries by State
</div>

**Analysis: ** We provided a bar chart showing the count of breweries by state. The state with the highest count of breweries is Colorado with 47 breweries. There is a four way tie between DC, North Dakota, South Dakota, and West Virginia for the lowest with one brewery each. The mean count of breweries per state is eleven.


#### Agenda 1b: Distribution by State

Load files and confirm, how many breweries are located in each state?

      --- R
      lookup = data.frame(State = state.abb, State_Name = state.name) #makes a dataframe with State na me and state abb. 
      Breweries2 = inner_join(Breweries,lookup, by = "State")
      BreweriesMapData = Breweries2 %>% group_by(State) %>% count(State_Name) #head(BreweriesMapData)
      colnames(BreweriesMapData)[3] = "Breweries" #change 'n' to 'Breweries' BreweriesMapData$region <- tolower(BreweriesMapData$State_Name) #head(BreweriesMapData)
      BreweriesMapData2 = BreweriesMapData[-1] #drop the first column states <- map_data("state")
      map.df <- merge(states, BreweriesMapData2, by = "region", all.x = TRUE) head(map.df)
      ---
   
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic2.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    Map of Breweries by State
</div>
      
**Analysis: ** In addition to the bar chart, a heat map showing the distribution of breweries was included. This was added as a “knock their socks off” addition as it enhanced the answer to their question visually.


#### Question 2 - Merge beer data with the breweries data.

Print the first 6 observations and the last six observations to check the merged file.

      --- R
      merged_df = merge(Beers,Breweries, by.x = "Brewery_id", by.y = "Brew_ID") #joining when keys do not match
      head(merged_df,6) #to show the first 6 observations
      ---
      
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic19.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    Merged dataset
</div>

**Analysis: ** Using merge() we brought in the Breweries csv file against the Beers csv file. The method used was when the two keys were not identical


#### Agenda 2: Missing Values

Address the missing values in each column

      --- R
      #merged_df %>% is.na() #check for missing values , ABV and IBU
      #Cleaning the data
      merged_df <- merged_df %>% na.omit() 
      ---
      
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic20.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    Proof of Missing Values
</div>

**Analysis: ** There were 62 missing values from column ABV, approximately three percent of the total. There were 1,005 missing values from column IBU. The data was review and we could not locate a relationship amongst the missing data and the qualifiers. Example, there did not appear to be an observable difference between data missing across the State data, or Brewery data. Overall, it appeared that the data was missing completely at random with no way of back tracking into an answer for the missing values.


#### Agenda 3: Mean ABV %

mean of ABV by State and bar chart

      --- R
      #create a new df to add Mean ABV % 
    merged_df1 <- merged_df %>% group_by(State) %>% summarize(meanABV = mean(ABV, na.rm = TRUE)) #ad d column meanABV with the mean of ABV. 
    #confirm meanABV has been added 
    #merged_df1
    #plot to show the meanABV % by state, update labels, remove legend. 
    ggplot(merged_df1, aes(x = State, y = meanABV, fill = State)) + 
    theme(legend.position = "none") + #removed the legend
    geom_bar(stat = "identity") + geom_text(aes(label = round(meanABV, 2), y = meanABV + .01), siz e = 2) + #using round for cleaner looking labels
    ggtitle("ABV % mean by State") + xlab("State") + ylab("Mean ABV %") + ylim(0.0,0.1) + #zoom in on the y-axis for small %s
    theme(axis.text.x = element_text(angle = 90, hjust = 1)
      ---
      
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic3.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    Plot of ABV% mean by state
</div>

**Analysis: ** New Mexico has the highest mean Alcohol by Volumne % (ABV %) and Utah has the lowest ABV %. Each state was calculated and a label was added to show each. To prevent overlapping, the size of the mean labels were reduced


#### Agenda 4: Mean IBU 

mean of IBU by State and bar chart

      --- R
      #repeat with IBU
    #create a new dataframe with 
    merged_df2 <- merged_df %>% group_by(State) %>% summarize(meanIBU = mean(IBU, na.rm = TRUE)) #ad d column meanABV with the mean of IBU. 
    #confirm meanIBU has been added 
    #plot to show the meanIBU by state, update labels, remove legend.
    ggplot(merged_df2, aes(x = State, y = meanIBU, fill = State)) + 
    theme(legend.position = "none") + #removed the legend
    geom_bar(stat = "identity") + geom_text(aes(label = round(meanIBU, 1), y = meanIBU + 2), size = 2) + #using round for cleaner looking labels
    ggtitle("IBU mean by State") + xlab("State") + ylab("Mean IBU") + ylim(0,60) + 
    theme(axis.text.x = element_text(angle = 90, hjust = 1))
      ---
      
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic4.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    Plot of IBU mean by state
</div>

**Analysis: ** West Virginia has the highest mean International Bitterness Units (IBU). Due to missing values, South Dakota had no data represented. The remaining states with data were calculated and a label was added to show each. To prevent overlapping, the size of the mean labels were reduced.


#### Agenda 5 - Finding the states with the most alcoholic beer and the most bitter beer.

Which state has the maximum alcoholic (ABV) beer

      --- R
      merged_df <- merged_df %>%  filter(!is.na(ABV)) 
      merged_df %>% group_by(State) %>% ggplot(aes(x = State, y = ABV, fill = State)) + theme(legend.p osition = "none") + geom_boxplot()  + ggtitle("Stem and Box plot of the ABV Values for each stat e")
      ---
      
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic5.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    Stem and Box Plot of the ABV values for each state
</div>

Which state has the most bitter (IBU) beer?

      --- R
      merged_df %>% group_by(State) %>% ggplot(aes(x = State, y = IBU, fill = State)) + theme(legend.p osition = "none") + geom_boxplot()  + ggtitle("Stem and Box plot of the IBU Values for each stat e")
      ---
      
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic6.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    Stem and Box Plot of the IBU values for each state
</div>

**Analysis: ** The state of Kentucky possesses the most alcoholic beverage with an ABV of 12.5%, while the state of Oregon, possesses the most biter beer with an IBU of 138 units


#### Agenda 6: Investigating the summary statistics of the Alcohol By Volume Variable.

Getting a  box plot for the summary

      --- R
      merged_df %>% group_by(ABV) %>% ggplot(aes(y = ABV)) + geom_boxplot(color = 'orange') + ggtitle ("The summary statistics of the ABV variable") + theme(legend.position = "none")
      ---
      
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic7.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    The Summary of the ABV variable
</div>

**Visualizing the distribution based on the states using a box plot **

Getting the boxplot for the state with the highest ABV (Kentucky)

      --- R
      merged_df[grep("KY", merged_df$State), ] %>% group_by(State) %>% ggplot(aes(y = ABV, x = State, fill = State)) + geom_boxplot() + ggtitle("The distribution of the ABV based on the state") + th eme(legend.position = "none")
      ---
      
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic8.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    The distribution of ABV based on the highest ABV state (KY)
</div>

Getting the boxplot for all states

      --- R
      merged_df %>% group_by(State) %>% ggplot(aes(y = ABV, x = State, fill = State)) + geom_boxplot() + ggtitle("The distribution of the ABV based on the state") + theme(legend.position = "none")
      ---
      
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic9.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    The distribution of ABV based on all the states in the US
</div>

Visualizing the distribution based on the city using a barchart

      --- R
      merged_df %>% group_by(City) %>% ggplot(aes(y = merged_df$ABV, x = City, fill = State)) + geom_b oxplot() + ggtitle("The distribution of the ABV based on the City") + theme(legend.position = "n one")
      ---
      
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic10.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    The distribution of ABV based on all the cities in the US
</div>

Visualizing the distribution based on the cities in Kentucky using a barchart

      --- R
      merged_df[grep("KY", merged_df$State), ] %>% ggplot(aes(y = ABV, x = City, fill = City)) + geom_ boxplot() + ggtitle("The distribution of the ABV based on cities in Kentucky") + theme(legend.po sition = "none")
      ---
      
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic11.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
     distribution based on the cities in Kentucky using a barchart
</div>

Visualizing the distribution based on the Brewery ID using a scatterplot

      --- R
      merged_df %>% group_by(Brewery_id) %>% ggplot(aes(y = ABV, x = Brewery_id, fill = Brewery_id)) + geom_point() + ggtitle("The distribution of the ABV based on each Brewery ID")
      ---
      
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic12.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
     distribution based on the Brewery ID using a scatterplot
</div>

Visualizing the distribution based on the weight in ounces using a barplot

      --- R
      merged_df %>% group_by(Ounces) %>% ggplot(aes(y = ABV, x = Ounces, fill = Ounces)) + geom_bar(st at = "identity") + ggtitle("The distribution of the ABV based on the weight of the beer drink (i n ounces")
      ---
      
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic13.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
     Distribution based on the weight in ounces using a barplot
</div>

Visualizing the distribution based on the IBU using a scatterplot

      --- R
      merged_df %>% group_by(IBU) %>% ggplot(aes(y = ABV, x = IBU, color = State)) + geom_point() + gg title("The distribution of the ABV based on each IBU") + theme(legend.position = "none")
      ---
      
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic14.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
     Distribution based on the IBU using a scatterplot
</div>

**Analysis: ** Looking at the summary statistics, the minimum value is 0.027, the 1st quartile value is 0.05, the Median value is 0.057, the 3rd Quarter is 0.068, the maximum value is 0.125. Valuable insight were also gotten from different categorical variables related to the ABV variable. Looking at the distribution based on the states, the state of Kentucky has the highest ABV value, the state of Oregon has the lowest ABV values, and there were 2 outliers in the plot, belonging the the states of Kentucky and Oregon. Looking at the distribution based on the brewery ID, the Beer “London Balling” with brewery ID #2 has the highest alcoholic content, while the beer “Totally Randler” with brewery ID# 81 has the lowest alcoholic content.


#### Agenda 6.5 : Investigating the summary statistics of the International Business Unit Variable

Getting a  box plot for the summary

      --- R
      merged_df %>% group_by(IBU) %>% ggplot(aes(y = IBU)) + geom_boxplot(color = 'brown') + ggtitle ("The summary statistics of the IBU variable") + theme(legend.position = "none") 
      ---
      
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic15.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
     Summary Statistics for the IBU variable
</div>

Visualizing the distribution based on the states using a box plot

      --- R
      merged_df %>% group_by(State) %>% ggplot(aes(y = IBU, x = State, fill = State)) + geom_boxplot() + ggtitle("The distribution of the IBU based on the state") + theme(legend.position = "none")
      ---
      
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic21.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
     distribution based on the states using a box plot
</div>

Visualizing the distribution based on the city using a barchart

      --- R
      merged_df %>% group_by(City) %>% ggplot(aes(y = merged_df$IBU, x = City, fill = State)) + geom_b oxplot() + ggtitle("The distribution of the IBU based on the City")  + theme(legend.position = "none")
      ---
      
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic22.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
     distribution based on the city using a barchart
</div>

Visualizing the distribution based on the cities in Kentucky using a barchart

      --- R
      merged_df[grep("KY", merged_df$State), ] %>% ggplot(aes(y = IBU, x = City, fill = City)) + geom_ boxplot() + ggtitle("The distribution of the IBU based on cities in Kentucky")
      ---
      
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic23.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
     distribution based on the cities in Kentucky using a barchart
</div>

Visualizing the distribution based on the Brewery ID using a scatterplot

      --- R
      merged_df %>% group_by(Brewery_id) %>% ggplot(aes(y = IBU, x = Brewery_id, fill = Brewery_id)) + geom_point() + ggtitle("The distribution of the IBU based on each Brewery ID")
      ---
      
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic24.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
     distribution based on the Brewery ID using a scatterplot
</div>

Visualizing the distribution based on the weight in ounces using a barplot

      --- R
      merged_df %>% group_by(Ounces) %>% ggplot(aes(y = IBU, x = Ounces, fill = Ounces)) + geom_bar(st at = "identity") + ggtitle("The distribution of the IBU based on the weight of the beer drink (i n ounces"
      ---
      
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic25.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
     distribution based on the weight in ounces using a barplot
</div>

The bar just shows the frequency distribution of the IBU for each weight 

      --- R
      merged_df %>% group_by(IBU) %>% ggplot(aes(y = ABV, x = IBU, color = State)) + geom_point() + gg title("The distribution of the ABV based on each IBU")  + theme(legend.position = "none")
      ---
      
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic26.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
     distribution of the ABV based on the IBU
</div>

**Analysis: ** Looking at the summary statistics, the minimum value is 4, the 1st quartile value is 21, the Median value is 35, the 3rd Quarter is 64, the maximum value is 138. Valuable insight were also gotten from different categorical variables related to the ABV variable. Looking at the distribution based on the states, the state of Oregon has the highest ABV value, and the state of Carlifornia has the lowest ABV values. Looking at the distribution based on the brewery ID, the Beer “Bitter B***th Imperial IPA” with brewery ID #2 has the highest alcoholic content, while the beer “Summer Solstice” with brewery ID# 81 has the lowest alcoholic content.


#### Agenda 7: Investigating the relationship between the ABV variable and IBU variable

      --- R
      merged_df %>% group_by(IBU) %>% ggplot(aes(y = ABV, x = IBU, color = State)) + geom_point() + gg title("The distribution of the ABV based on each IBU") + theme(legend.position = "none")
      ---
      
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic14.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
     distribution of the ABV based on the IBU
</div>

**Analysis: ** There is a positiver linear relationship between the bitterness of the beer and its alcoholic content. We can see from the plot above that for every high value in IBU there is a corresponding high value in ABV.


#### Agenda 8: Investigating the difference between the IPAs (India Pale Ales) and other types of ales in terms of their IPA and IBU values using KNN classification

We plan on visualizing the dataset

      ---
      # Using KNNs
      set.seed(123)
      # Step 1: Data Preprocessing
      #Extracting relevant data for the knn
      Budweiser_df = merged_df %>% filter(str_detect(Style, "IPA") | (str_detect(Style, "Ale"))) #filt ering the IPA and different ale beers using str_filter() & str_detect
      #grouping all IPA and Ale variables to groupnames
      Budweiser_df2 <- Budweiser_df %>%
      mutate(Style = case_when(
      grepl("IPA", Style, ignore.case = TRUE) ~ "IPA",
      grepl("Ale", Style, ignore.case = TRUE) ~ "Ale",
      TRUE ~ Style  # Keep the original name if no match
      ))
      # Step 2: Data Exploration
      #Visualizing the distribution of IBU and ABV values for the IPA and beers using a box plot Budweiser_df2 %>% group_by(IBU) %>% ggplot(aes(y = IBU)) + geom_boxplot(color = 'violet') + ggti tle("The summary statistics of the IBU variable") + theme(legend.position = "none")
      Budweiser_df2 %>% group_by(ABV) %>% ggplot(aes(y = ABV)) + geom_boxplot(color = 'purple') + ggti tle("The summary statistics of the ABV variable") + theme(legend.position = "none")
      ---
      
 <div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic15.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic16.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic17.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
     Visualizing the dataset
</div> 

Next we plan on looking at the metrics and 2 sample welch ttests

      ---
      # Step 3: Data Splitting
      #sorting the datasets into training and test data, Using an 80-20 split
      split_perc <- 0.80
      trainPosition = sample(1:nrow(Budweiser_df2)[1],round(split_perc * nrow(Budweiser_df2)[1])) #get ting the index for the training dataset
      trainData <- Budweiser_df2[trainPosition, ] testData <- Budweiser_df2[-trainPosition, ]
      
      # Step 4: Building the KNN model
      classifications <- knn(trainData[, c("IBU", "ABV")], testData[, c("IBU", "ABV")], trainData$Styl e, prob = TRUE, k = 5)
      #table(classifications, testData$Style)
      # Step 5: Model Evaluation
      CM = confusionMatrix(table(classifications,testData$Style))
      CM
      
      #Statistical Evidence
      #Using ttest to compare the mean of IBU and ABV variables Budweiser_IPA = Budweiser_df2 %>% filter(str_detect(Style, "IPA")) Budweiser_Ale = Budweiser_df2 %>% filter(str_detect(Style, "Ale")) t.test(Budweiser_IPA$IBU, Budweiser_Ale$IBU
      ---

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic18.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
     The classification metrics of the model
</div>

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6306_Project1/screenshots/pic27.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
     The ttest of the model
</div>

**Results: **  Using the KNN classificayion, the accuracy was found to be 86%, the Missclassification rate 14%, sensitivity, 90.4%, and the specitivity, 79.8%. Based on the welch’s 2 sample t-test, there is overwhelming evidence to suggest that there is a significant difference between the Ale and IPA drinks in term of their IBU (p-value < 2.2e- 16) and the ABV (P-value < 2.2e-16).


# Conclusion

Utilizing various file manipulation, string manipulation and data visualization techniques, we were able to find valuable insight into the data of US craft beers and US breweries, over the past years.

We were able to discover the distribution of breweries and beers, across different US states. We were also able to address missing values within our generated data, and investigated the effectiveness of the missing values within the dataset. From our investigation, we proved that Removing the missing values didnt affect our data. Statistical analysis was done to find and visualize valuable statistical data like states that produced drinks with the highest average values of the Alcohol by Volume variable and the International Bitterness Unit Variable, the stateswith most alcoholic drink and the most bitter drink. We were able to provide more statistical insight into the Alcohol by beverage data, by looking into their mean, maximum and minimum values, and looking into how they affect different variables like the IBU, the brewery ID, and the states.

Lastly we were able to use kNN, and a ttest to prove that there is a significant relationship between the IPA drinks and the Ale drinks.

