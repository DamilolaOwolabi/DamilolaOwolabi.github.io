---
layout: page
title: Frito Lay Talent Attrition Analysis
description: Predicted employee attrition and monthly income for 870 employees in R, comparing Naive Bayes and KNN on imbalanced data.
img: assets/img/projects/covers/frito-lay-attrition.jpg
importance: 1
category: school
tools: [R, Regression, Naive Bayes, KNN]
---

<dl class="case-glance">
  <div><dt>Context</dt><dd>SMU MS in Data Science, DS 6306 final case study</dd></div>
  <div><dt>Data</dt><dd>870 employees, 36 variables, loaded from AWS S3</dd></div>
  <div><dt>Stack</dt><dd>R, caret, Naive Bayes, KNN, R Shiny</dd></div>
  <div><dt>Result</dt><dd>Monthly income model: test RMSE 1,092, well under the 3,000 target</dd></div>
</dl>

<div class="case-links">
<a class="hero-btn hero-btn-secondary" href="{{ '/assets/pdf/projects/Frito_Lay_Attrition_Presentation.pdf' | relative_url }}" target="_blank" rel="noopener"><i class="fa-solid fa-file-pdf" aria-hidden="true"></i><span>View the slides (PDF)</span></a>
<a class="hero-btn hero-btn-secondary" href="https://oluwadamilolaowolabi.shinyapps.io/DS_6372_Project_2/" target="_blank" rel="noopener"><i class="fa-solid fa-chart-line" aria-hidden="true"></i><span>Try the Shiny app</span></a>
<a class="hero-btn hero-btn-secondary" href="https://github.com/DamilolaOwolabi/DS_6306_Project_2" target="_blank" rel="noopener"><i class="fa-brands fa-github" aria-hidden="true"></i><span>Code on GitHub</span></a>
</div>

## Overview

**The question.** In this case study, a talent management firm (DDSAnalytics) was asked by Frito Lay to find what drives employee attrition, and to predict both attrition and monthly income for new employees.

**What I did.** I explored all 36 variables, built a linear regression for monthly income using forward selection on RMSE, and built attrition classifiers using forward selection on AUC. Only 140 of the 870 employees had left, so I compared Naive Bayes with a tuned threshold against KNN with undersampling to handle the imbalance.

**Key findings**

- Monthly income is best predicted by job level, job role and total working years; the model scored a test RMSE of 1,091.64 against a target of 3,000.
- The strongest attrition signals were overtime, job involvement, job satisfaction, number of companies worked for, and years since last promotion.
- Naive Bayes was very specific (0.99) but missed most leavers (sensitivity 0.12); KNN with undersampling caught more leavers and gave the better balance of sensitivity and specificity.
- Recommendations: offer more retention incentives, and tie stock options to years of service.

### Presentation

<div class="video-embed"><iframe src="https://www.youtube-nocookie.com/embed/hwyr3ZPVgIQ" title="Frito Lay attrition presentation" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>

## Full analysis

### Loading libraries

<details class="code-fold" markdown="1">
<summary>Show R code</summary>

```r
library(ggplot2) #For data visualization
library(dplyr)  # For data manipulation
library(tidyverse)
#install.packages('aws.s3')
library(aws.s3) #to access the aws s3 package
library(caret) # Load the caret package
library(pROC) # for the ROC curve
library(class) #calling the knn function
library(e1071)  # for naiveBayes function
```

</details>

### Getting the CSV file from AWS using aws.s3 packages

<details class="code-fold" markdown="1">
<summary>Show R code</summary>

```r
Sys.setenv("AWS_ACCESS_KEY_ID" = "MY_ACCESS_ID",
           "AWS_SECRET_ACCESS_KEY" = MY_SECRET_ACCESS_KEY",
           "AWS_DEFAULT_REGION" = "MY_DEFAULT_REGION")


# Using aws.s3
aws.s3::bucketlist()
aws.s3::get_bucket("msdsds6306")


# read and write from ojbect

#Read in the train data
Talent_Train = s3read_using(FUN = read.csv,
                    bucket = "msdsds6306",
                    object = "CaseStudy2-data.csv")

#Reading in  the Test Data for Attrition
Talent_Test_Attrition = s3read_using(FUN = read.csv,
                    bucket = "msdsds6306",
                    object = "CaseStudy2CompSet No Attrition.csv")

#Reading in  the Test Data for monthly income
Talent_Test_Salary = s3read_using(FUN = read.csv,
                    bucket = "msdsds6306",
                    object = "CaseStudy2CompSet No Salary.csv")

#Reading in  an example of prediction Regeression
Example = s3read_using(FUN = read.csv,
                    bucket = "msdsds6306",
                    object = "Case2PredictionsRegressEXAMPLE.csv")

#Reading in  an example of prediction classification
Example2 = s3read_using(FUN = read.csv,
                    bucket = "msdsds6306",
                    object = "Case2PredictionsClassifyEXAMPLE.csv")


#How many variables in the dataset ? 36

#Our response variable will be based on the attrition variable
```

</details>

From the Train talent data, there are 870 random employees (rows), all ordered by IDD, and 36 variables (columns).

### Looking at the dataset

<details class="code-fold" markdown="1">
<summary>Show R code</summary>

```r
set.seed(1234)

# Set levels for Talent_Train
Talent_Train$Attrition <-factor(Talent_Train$Attrition, levels=c('Yes','No')) #factoring the response variable
Talent_Train <- Talent_Train %>% mutate(Over18_binary = ifelse(Over18 == "Y", 1, 0)) # breaking the Over18 variable into 2, because it has only one level, and keeps throwing an error.

Talent_Train <- subset(Talent_Train, select = -c(Over18)) #removing the over18 column

# Set levels for Talent_Test_Salary
Talent_Test_Salary$Attrition <-factor(Talent_Test_Salary$Attrition, levels=c('No','Yes')) #factoring the response variable
Talent_Test_Salary <- Talent_Test_Salary %>% mutate(Over18_binary = ifelse(Over18 == "Y", 1, 0)) # breaking the Over18 variable into 2, because it has only one level.
Talent_Test_Salary <- subset(Talent_Test_Salary , select = -c(Over18)) #removing the over18 column

yes_data <- Talent_Train[Talent_Train$Attrition == 'Yes',] # 4250
no_data <- Talent_Train[Talent_Train$Attrition == 'No',] # 31918
```

</details>

The rate of Yes Attrition to no Attrition is 140: 730. Which presents the issue of an unbalanced data. This might be costly to sensitivity metric. I handle this later with a tuned threshold and undersampling.

### Addressing missing values

It is important to look at missing values earlier on, as it might be affect our models

<details class="code-fold" markdown="1">
<summary>Show R code</summary>

```r
NaSum <- sum(is.na(Talent_Train)) #check for missing values in the Talent Dataset

# Print the total count of missing values
print(paste("Total missing values:", NaSum))
```

</details>

> [1] "Total missing values: 0"

From the results above, there appears to be no missing values in the Dataset

## Salary

### Looking at the Summary Statistics

<details class="code-fold" markdown="1">
<summary>Show R code</summary>

```r
# Using a for loop to get the summary statistics

# Initialize an empty list
numerical_count <- 0 # There are 27
categorical_count <- 0 # There are 9
summary_stats_numerical <- list() # Storing summary statistics for the numerical variables
summary_stats_categorical <- list() # Storing summary statistics for the categorical variables
summary_stats2_categorical <- list() # Storing summary statistics for the categorical variables
categorical_variables <- list() #Storing categorical variables
numerical_variables <- list() #Storing numerical variables

# Iterate over each column in the data frame
for (Variable in names(Talent_Train)) {
  # Calculate summary statistics for numeric variables
  if (is.numeric(Talent_Train[[Variable]])) {
    summary_stats_numerical[[Variable]] <- summary(Talent_Train[[Variable]])
    numerical_variables[[Variable]] <- Variable
    numerical_count <- numerical_count + 1
  } else {
    # For non-numeric variables, calculate frequency table
    summary_stats_categorical[[Variable]] <- table(Talent_Train[[Variable]])
    summary_stats2_categorical[[Variable]] <- summary(Talent_Train[[Variable]])
    categorical_variables[[Variable]] <- Variable
    categorical_count <- categorical_count + 1
  }
}

cat("There are  ", numerical_count, " numerical variables \n")
cat("The numerical variables are: ")
#Printing the numerical variables
for (variable in names(numerical_variables)){
  print(numerical_variables[[variable]])
}
cat("\n")

cat("There are  ", categorical_count, " categorical variables \n")
cat("The categorical variables are: ")
#Printing the categorical variables
for (variable in names(categorical_variables)){
  print(categorical_variables[[variable]])
}
cat("\n")

# Print summary statistics for each numerical variable
for (col_name in names(summary_stats_numerical)) {
  cat("Summary statistics for", col_name, ":\n")
  print(summary_stats_numerical[[col_name]])
  cat("\n")
}

# Print summary statistics for each categorical variable
for (col_name in names(summary_stats_categorical)) {
  cat("Summary statistics for", col_name, ":\n")
  print(summary_stats_categorical[[col_name]])
  #print(summary_stats2_categorical[[col_name]])
  cat("\n")
}
```

</details>

> There are 28 numerical variables
> There are 8 categorical variables

From our summary Statistics, there are 28 numerical variables and 8 categorical variables. All adding to 36 variables. Some variables that stood out were the EmployeeCount, which have a constant 1 values, and the Job Involvement, which values ranges between 1 and 4, hence providing a really low variance,.

### Visualizing the numerical variables summary statistics

Since the variables are a lot, and I plan on saving time, I plan using a for loop to iterate through the variables and plot their box plots to visualize their summary statistics

<details class="code-fold" markdown="1">
<summary>Show R code</summary>

```r
    for (Variable in names(Talent_Train)){
  # Check if the column is numeric
  if (is.numeric(Talent_Train[[Variable]])) {
    # Create a box plot for numeric variables
   plot <-  ggplot(Talent_Train, aes_string(x = , y = Variable)) +
      geom_boxplot(color = "black", fill = "lightblue") +
      labs(title = paste("Box Plot of", Variable)) +
      geom_text(aes(label = paste("Median:", median(Talent_Train[[Variable]]), "\n",
                                  "Mean: ", mean(Talent_Train[[Variable]]), "\n",
                                  "SD: ", sd(Talent_Train[[Variable]]),
                                  "1st Quarter: ", summary(Talent_Train[[Variable]])[2], "\n",
                                  "3rd Quarter: ", summary(Talent_Train[[Variable]])[4], "\n",
                                  "Min: ", summary(Talent_Train[[Variable]])[1], "\n",
                                  "Max: ", summary(Talent_Train[[Variable]])[5], "\n")),
                x = 0.4, y = max(Talent_Train[[Variable]]), hjust = 1, vjust = 1, size = 3, color = "blue")

   # Print the plot
    print(plot)
  }
}
```

</details>

<div style="overflow-x: auto; white-space: nowrap; padding: 5px;">
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the numerical variables summary statistics (figure 1)" loading="eager" path="assets/img/DS_6306_Project_2/pic_1.png" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the numerical variables summary statistics (figure 2)" loading="eager" path="assets/img/DS_6306_Project_2/pic_2.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the numerical variables summary statistics (figure 3)" loading="eager" path="assets/img/DS_6306_Project_2/pic_3.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the numerical variables summary statistics (figure 4)" loading="eager" path="assets/img/DS_6306_Project_2/pic_4.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the numerical variables summary statistics (figure 5)" loading="eager" path="assets/img/DS_6306_Project_2/pic_5.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the numerical variables summary statistics (figure 6)" loading="eager" path="assets/img/DS_6306_Project_2/pic_6.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the numerical variables summary statistics (figure 7)" loading="eager" path="assets/img/DS_6306_Project_2/pic_7.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the numerical variables summary statistics (figure 8)" loading="eager" path="assets/img/DS_6306_Project_2/pic_8.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the numerical variables summary statistics (figure 9)" loading="eager" path="assets/img/DS_6306_Project_2/pic_9.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
        <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the numerical variables summary statistics (figure 10)" loading="eager" path="assets/img/DS_6306_Project_2/pic_10.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
   <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the numerical variables summary statistics (figure 11)" loading="eager" path="assets/img/DS_6306_Project_2/pic_11.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
     <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the numerical variables summary statistics (figure 12)" loading="eager" path="assets/img/DS_6306_Project_2/pic_12.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
     <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the numerical variables summary statistics (figure 13)" loading="eager" path="assets/img/DS_6306_Project_2/pic_13.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the numerical variables summary statistics (figure 14)" loading="eager" path="assets/img/DS_6306_Project_2/pic_14.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
     <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the numerical variables summary statistics (figure 15)" loading="eager" path="assets/img/DS_6306_Project_2/pic_15.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the numerical variables summary statistics (figure 16)" loading="eager" path="assets/img/DS_6306_Project_2/pic_16.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the numerical variables summary statistics (figure 17)" loading="eager" path="assets/img/DS_6306_Project_2/pic_17.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the numerical variables summary statistics (figure 18)" loading="eager" path="assets/img/DS_6306_Project_2/pic_18.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the numerical variables summary statistics (figure 19)" loading="eager" path="assets/img/DS_6306_Project_2/pic_19.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the numerical variables summary statistics (figure 20)" loading="eager" path="assets/img/DS_6306_Project_2/pic_20.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the numerical variables summary statistics (figure 21)" loading="eager" path="assets/img/DS_6306_Project_2/pic_21.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the numerical variables summary statistics (figure 22)" loading="eager" path="assets/img/DS_6306_Project_2/pic_22.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the numerical variables summary statistics (figure 23)" loading="eager" path="assets/img/DS_6306_Project_2/pic_23.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the numerical variables summary statistics (figure 24)" loading="eager" path="assets/img/DS_6306_Project_2/pic_24.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the numerical variables summary statistics (figure 25)" loading="eager" path="assets/img/DS_6306_Project_2/pic_25.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the numerical variables summary statistics (figure 26)" loading="eager" path="assets/img/DS_6306_Project_2/pic_26.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the numerical variables summary statistics (figure 27)" loading="eager" path="assets/img/DS_6306_Project_2/pic_27.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the numerical variables summary statistics (figure 28)" loading="eager" path="assets/img/DS_6306_Project_2/pic_28.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    List of summary statistics for the numerical variables (Please scroll through to look at the plots.)
</div>

From the box plots, 4 variables have really bad spread of data. They are : EmployeeCount, Over_18_Binary, PerformanceRating, and StandardHours

### Visualizing the variables interactions with the response variable (monthly income)

Since the variables are a lot, and I plan on saving time, I plan using a for loop to iterate through the variables and plot their bar plots to visualize their EDA

<details class="code-fold" markdown="1">
<summary>Show R code</summary>

```r
    # Iterate through the dataset and execute the plot command
for (Variable in names(Talent_Train)){
  # Check if the column is numeric
  if (!(Variable == "MonthlyIncome")) {

    # Construct the bunch of commands with the current variable

  command <- paste0(
    "Talent_Train %>% ggplot(aes(x=", Variable, ",y= MonthlyIncome, fill = ", Variable, ")) + geom_bar(stat='identity')  + \n",
    "ylab('Monthly Income') + xlab('", Variable, "') + ggtitle('", Variable, " Distribution Based on Monthly Income') + theme_minimal() \n"
  )

    # Execute the command
    plot <- eval(parse(text = command))

    print(plot)
  }
}
```

</details>

 <div style="overflow-x: auto; white-space: nowrap; padding: 5px;">
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 1)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_1.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 2)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_2.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 3)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_3.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 4)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_4.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 5)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_5.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 6)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_6.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 7)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_7.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 8)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_8.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 9)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_9.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 10)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_10.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 11)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_11.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 12)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_12.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 13)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_13.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 14)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_14.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 15)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_15.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 16)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_16.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 17)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_17.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 18)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_18.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 19)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_19.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 20)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_20.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 21)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_21.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 22)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_22.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 23)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_23.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 24)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_24.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 25)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_25.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 26)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_26.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 27)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_27.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 28)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_28.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 29)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_29.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 30)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_30.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 31)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_31.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 32)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_32.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 33)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_33.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the variables interactions with the response variable (monthly income) (figure 34)" loading="eager" path="assets/img/DS_6306_Project_2/Group_B/pic_34.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    List of plots of the response variable (Salary) vs. the various dependent variables (Please scroll through to look at the plots.)
</div>

- Employees in Job Level 2 seems to be paid the best
- Sales Executive seems to be the highest paid in the company.
- The employees with around 10 years seem to be paid the highest.
- Employees with Job involvement rate of 3 are the highest paid in the company.
- The employees with Stock option level 1 seem to have the highest monthly salary.
- Human Resources Employees seem to be the lowest paid

### P-value distributions for monthly income

Looking at how each variable in the model, significantly impacts our response variable (MonthlyIncome)

<details class="code-fold" markdown="1">
<summary>Show R code</summary>

```r
model <-lm(MonthlyIncome ~ ., data = Talent_Train)

# Extract variable names
variable_names <- rownames(summary(model)$coefficients)

# getting the  p-values from the model3
p_values <- summary(model)$coefficients[, 4]  # Assuming p-values are in the 4th column of the summary table
p_values <- data.frame(p_values)$p_values

df <- data.frame(variable_names, p_values) #combining the pvalues and variable names into a dataframe

df <- df[!df$p_value == 0 , ] #removing varaiables with pvalue = 0
df$p_values <- log(df$p_values)  * -1

# Rank p-values in the dataset from max to min
df$rank <- rank(-df$p_value)

sorted_df <- df[order(df$rank), ]


barplot(df$p_values,
        main = "P-values of Regression Coefficients less than the significance level 0.05",
        xlab = "Variables",
        ylab = "P-value",
        names.arg = df$variable_names,
        las = 2,  # Rotate x-axis labels vertically for better readability
        col = "steelblue",  # Set color of bars
        ylim = c(exp(0.05) * -1, max(sorted_df$p_values) * 1.2)  # Set ylim from the significance level to the max p-values

)

library(ggplot2)
ggplot(sorted_df,aes(variable_names,p_values, fill = ifelse(p_values > (exp(0.05) * -1), "Positive", "Negative"))) + #filtering just the highly significant p-values
  geom_bar(stat="identity", fill = "skyblue") +
  #geom_text(aes(label = variable_names), vjust = -0.5) +  # Add text labels on top of bars
  scale_fill_manual(values = c("Positive" = "skyblue", "Negative" = "salmon")) +
  labs(x = "Variables", y = "P-values", title = "P-values of Regression Coefficients less than the significance level 0.05") +
  theme(axis.text.x = element_text(angle = 90, vjust = 0.5, hjust=1))  # Rotate x-axis labels for better readability
```

</details>

<div class="row justify-content-sm-center">
    <div class="col-sm-6 mt-3 mt-md-0">
        {% include figure.liquid alt="Looking at the pvalue distributions for the monthly income (figure 1)" loading="eager" path="assets/img/DS_6306_Project_2/GROUP_C/Pic_1.png" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm-6 mt-3 mt-md-0">
        {% include figure.liquid alt="Looking at the pvalue distributions for the monthly income (figure 2)" loading="eager" path="assets/img/DS_6306_Project_2/GROUP_C/Pic_2.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    2 different plots of the p-value distribution
</div>

From the plot above, we can see that the top 5 highly significant values with respect to the response variable y in terms of its relative most significant to least significant variables are JobLevel, JobRole, TotalWorkingYears, BusinessTravel, YearsSinceLastPromotion

### Forward selection on RMSE for the monthly income model

My plan is to iterate through finding the logistic regression with the min rmse value when interacting our response variable with various predictors. Then I'll pick the variable with the min rmse. I'll add my min rmse variable to the model, then use the next iteration to get the min rmse when add another variable with our prior variable, then interact them with our response variable. Then I repeat the steps again to get my optimum model.

### Getting the first variable

I'm looking for the perfect (MonthlyIncome ~ dependent variable) combination to get the minimum RMSE

<details class="code-fold" markdown="1">
<summary>Show R code</summary>

```r
# FORWARD SELECTION # 1
set.seed(21)
vars <- names(Talent_Train)
vars <- vars[vars != "MonthlyIncome"] #iterating thru variables that are not "MonthlyIncome"
vars <- vars[vars != "Attrition"] #iterating thru variables that are not "Attrition"
num_vars <- length(vars)
var_rmse <- data.frame("vars" = vars)
num_folds <- 10
for (j in 1:num_vars) {
  var <- vars[j]
  #print(var)
  folds <- createFolds(Talent_Train$MonthlyIncome, k = num_folds)
  rmse_scores <- numeric(num_folds)
  for (i in 1:num_folds) {
    #using the train data
    train_indices <- unlist(folds[-i])
    test_indices <- unlist(folds[i])
    train <- Talent_Train[train_indices, ]
    test <- Talent_Train[test_indices, ]
    form <- as.formula(paste("MonthlyIncome ~ ",var,sep=""))
    model <-lm(form, data = train) #fit a linear regression model
    predictions <- predict(model, newdata = test) #Make Predictiions
    residuals <- predictions - test$MonthlyIncome # Calculate residuals
    rmse <- sqrt(mean(residuals^2)) # Compute RMSE
    rmse_scores[i] <- rmse
  }
  var_rmse$rmse[var_rmse$var == var] <- mean(rmse_scores)
}

min_rmse = min(var_rmse$rmse) #finding the max_rmse
min_rmse_variable <- var_rmse$vars[which.min(var_rmse$rmse)]

#printing out rresult
cat("optimum Variable is ", min_rmse_variable, " with a minimum rmse of ", min_rmse)
```

</details>

> optimum Variable is JobLevel with a minimum rmse of 1409.276

### Getting the second variable

Next I'll look for the optimum variable to add to our regression model (Monthly ~ JobLevel) in order to provide the minimum rmse

<details class="code-fold" markdown="1">
<summary>Show R code</summary>

```r
# FORWARD SELECTION # 2
set.seed(21)
vars <- names(Talent_Train)
vars <- vars[vars != "MonthlyIncome"] #iterating thru variables that are not "MonthlyIncome"
vars <- vars[vars != "Attrition"] #iterating thru variables that are not "Attrition"
vars <- vars[vars != "JobLevel"] #iterating thru variables that are not "JobeLevel"
num_vars <- length(vars)
var_rmse <- data.frame("vars" = vars)
num_folds <- 10
for (j in 1:num_vars) {
  var <- vars[j]
  #print(var)
  folds <- createFolds(Talent_Train$MonthlyIncome, k = num_folds)
  rmse_scores <- numeric(num_folds)
  for (i in 1:num_folds) {
    #using the train data
    train_indices <- unlist(folds[-i])
    test_indices <- unlist(folds[i])
    train <- Talent_Train[train_indices, ]
    test <- Talent_Train[test_indices, ]
    form <- as.formula(paste("MonthlyIncome ~ JobLevel +  ",var,sep=""))
    model <-lm(form, data = train) #fit a linear regression model
    predictions <- predict(model, newdata = test) #Make Predictiions
    residuals <- predictions - test$MonthlyIncome # Calculate residuals
    rmse <- sqrt(mean(residuals^2)) # Compute RMSE
    rmse_scores[i] <- rmse
  }
  var_rmse$rmse[var_rmse$var == var] <- mean(rmse_scores)
}

min_rmse = min(var_rmse$rmse) #finding the max_rmse
min_rmse_variable <- var_rmse$vars[which.min(var_rmse$rmse)]

cat("optimum Variable is ", min_rmse_variable, " with a minimum rmse of ", min_rmse)
```

</details>

> optimum Variable is JobRole with a minimum rmse of 1085.182

### Getting the third variable

Next I'll look for the optimum variable to add to our regression model (Monthly ~ JobLevel + JobRole) in order to provide the minimum rmse

<details class="code-fold" markdown="1">
<summary>Show R code</summary>

```r
# FORWARD SELECTION # 3
set.seed(21)
vars <- names(Talent_Train)
vars <- vars[vars != "MonthlyIncome"] #iterating thru variables that are not "MonthlyIncome"
vars <- vars[vars != "Attrition"] #iterating thru variables that are not "Attrition"
vars <- vars[vars != "JobLevel"] #iterating thru variables that are not "JobeLevel"
vars <- vars[vars != "JobRole"] #iterating thru variables that are not "JobRole"
num_vars <- length(vars)
var_rmse <- data.frame("vars" = vars)
num_folds <- 10
for (j in 1:num_vars) {
  var <- vars[j]
  #print(var)
  folds <- createFolds(Talent_Train$MonthlyIncome, k = num_folds)
  rmse_scores <- numeric(num_folds)
  for (i in 1:num_folds) {
    #using the train data
    train_indices <- unlist(folds[-i])
    test_indices <- unlist(folds[i])
    train <- Talent_Train[train_indices, ]
    test <- Talent_Train[test_indices, ]
    form <- as.formula(paste("MonthlyIncome ~ JobLevel +  JobRole + ",var,sep=""))
    model <-lm(form, data = train) #fit a linear regression model
    predictions <- predict(model, newdata = test) #Make Predictiions
    residuals <- predictions - test$MonthlyIncome # Calculate residuals
    rmse <- sqrt(mean(residuals^2)) # Compute RMSE
    rmse_scores[i] <- rmse
  }
  var_rmse$rmse[var_rmse$var == var] <- mean(rmse_scores)
}

min_rmse = min(var_rmse$rmse) #finding the max_rmse
min_rmse_variable <- var_rmse$vars[which.min(var_rmse$rmse)]

cat("optimum Variable is ", min_rmse_variable, " with a minimum rmse of ", min_rmse)
```

</details>

> optimum Variable is TotalWorkingYears with a minimum rmse of 1061.89

### Testing the RMSE with the test dataset

Next, I'll test our optimum model, wit out dataset, splitting the dataset as test and train with a 70 - 30 split respectively.

<details class="code-fold" markdown="1">
<summary>Show R code</summary>

```r
#splitting 70% - 30%
trainIndices = sample(seq(1:length(Talent_Train$Age)),round(.7*length(Talent_Train$MonthlyIncome))) #split is 70% and 30%
train = Talent_Train[trainIndices,] #train datset
test = Talent_Train[-trainIndices,] #test dataset

# Fit the linear regression model
model <- lm(MonthlyIncome ~ JobLevel + JobRole + TotalWorkingYears, data = train)

# Make predictions
predictions <- predict(model, newdata = test)

# Calculate residuals
residuals <- predictions - test$MonthlyIncome

# Compute RMSE
rmse <- sqrt(mean(residuals^2))

# Print RMSE
print(rmse)
```

</details>

> [1] 1091.637

the RMSE is 1091.37, which is far lower than our expected RMSE of 3000. Hence proving this is an optimum dataset.

## Attrition rate

Next, I will try finding the best variables for our predictive classification model with Attrition as our response variable

### Visualizing the categorical variables interactions with the response variable (attrition)

Looking at the Exploratory data analysis to visualize the relationship between the attrition rate and other dependent variables

<details class="code-fold" markdown="1">
<summary>Show R code</summary>

```r
# Since the variables are a lot, and i plan on saving time, I plan using a for loop to iterate through the variables and plot their bar plots to visualize their EDA
# Iterate through the dataset and execute the plot command
for (Variable in names(Talent_Train)){
  # Check if the column is numeric
  if  (!(Variable == "Attrition")) { #(!is.numeric(Talent_Train[[Variable]]) &&

    # Construct the bunch of commands with the current variable

  command <- paste0(
    "summary <- Talent_Train %>% \n",
    "group_by(", Variable, ", Attrition) %>% \n",
    "summarize(count=n(), .groups = 'drop') \n",
    "summary$perc <- 0 \n",
    "summary$perc[summary$Attrition == 'No'] <- summary$count[summary$Attrition == 'No'] / nrow(Talent_Train[Talent_Train$Attrition == 'No',]) * 100 \n",
    "summary$perc[summary$Attrition == 'Yes'] <- summary$count[summary$Attrition == 'Yes'] / nrow(Talent_Train[Talent_Train$Attrition == 'Yes',]) * 100 \n",
    "summary %>% ggplot(aes(x=", Variable, ",y=perc,fill=Attrition)) + geom_bar(stat='identity') + facet_wrap(~Attrition) + \n",
    "ylab('Percentage') + xlab('", Variable, "') + ggtitle('", Variable, " Distribution Based on Attrition Value') + theme_minimal() \n"
  )

    # Execute the command
    plot <- eval(parse(text = command))

    print(plot)
  }
}
```

</details>

 <div style="overflow-x: auto; white-space: nowrap; padding: 5px;">
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 1)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic1.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 2)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic2.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 3)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic3.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 4)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic4.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 5)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic5.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 6)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic6.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 7)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic7.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 8)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic8.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 9)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic9.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 10)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic10.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 11)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic11.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 12)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic12.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 13)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic13.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 14)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic14.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 15)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic15.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 16)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic16.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 17)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic17.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 18)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic18.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 19)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic19.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 20)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic20.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 21)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic21.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 22)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic22.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 23)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic23.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 24)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic24.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 25)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic25.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 26)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic26.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 27)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic27.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 28)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic28.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 29)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic29.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 30)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic30.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 31)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic31.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 32)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic32.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 33)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic33.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 34)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic34.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0" style="display: inline-block;">
        {% include figure.liquid alt="Visualizing the categorical variables interactions with the response variable (attrition) (figure 35)" loading="eager" path="assets/img/DS_6306_Project_2/Group_D/Pic35.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    List of plots of the response variable (Attrition) vs. the various dependent variables (Please scroll through to look at the plots.)
</div>

- There seems to be a high turnover rate among employees with zero stock options level.
- There is a higher level of Employee turnover Rate among the employees in Job Level
- There is a similar distribution overall between the monthly salary and employees that didn’t leave in terms of JobLevel.
- There are similarities among the yes and no distributions.
- There seems to be high turnover rate among employees with 10 years of in the company.
- There seems to be a low turn over rate among employees with 1-3 years in the company.
- There are similar distribution among the monthly income and the no attrition rates.

### P-value distributions for attrition

Looking at how each variable in the model, significantly impacts our response variable (MonthlyIncome)

<details class="code-fold" markdown="1">
<summary>Show R code</summary>

```r
model <-glm(Attrition ~ ., data = Talent_Train, family="binomial")

# Extract variable names
variable_names <- rownames(summary(model)$coefficients)

# getting the  p-values from the model3
p_values <- summary(model)$coefficients[, 4]  # Assuming p-values are in the 4th column of the summary table
p_values <- data.frame(p_values)$p_values

df <- data.frame(variable_names, p_values) #combining the pvalues and variable names into a dataframe

df <- df[!df$p_value == 0 , ] #removing varaiables with pvalue = 0
df$p_values <- log(df$p_values)  * -1

# Rank p-values in the dataset from max to min
df$rank <- rank(-df$p_value)

sorted_df <- df[order(df$rank), ]

sorted_df


barplot(df$p_values,
        main = "P-values of Regression Coefficients less than the significance level 0.05",
        xlab = "Variables",
        ylab = "P-value",
        names.arg = df$variable_names,
        las = 2,  # Rotate x-axis labels vertically for better readability
        col = "steelblue",  # Set color of bars
        ylim = c(exp(0.05) * -1, max(sorted_df$p_values) * 1.2)  # Set ylim from the significance level to the max p-values

)

library(ggplot2)
ggplot(sorted_df,aes(variable_names,p_values, fill = ifelse(p_values > (exp(0.05) * -1), "Positive", "Negative"))) + #filtering just the highly significant p-values
  geom_bar(stat="identity", fill = "skyblue") +
  #geom_text(aes(label = variable_names), vjust = -0.5) +  # Add text labels on top of bars
  scale_fill_manual(values = c("Positive" = "skyblue", "Negative" = "salmon")) +
  labs(x = "Variables", y = "P-values", title = "P-values of Regression Coefficients less than the significance level 0.05") +
  theme(axis.text.x = element_text(angle = 90, vjust = 0.5, hjust=1))  # Rotate x-axis labels for better readability
```

</details>

<div class="row justify-content-sm-center">
    <div class="col-sm-6 mt-3 mt-md-0">
        {% include figure.liquid alt="Looking at the pvalue distributions for the attrition (figure 1)" loading="eager" path="assets/img/DS_6306_Project_2/Group_E/pic1.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm-6 mt-3 mt-md-0">
        {% include figure.liquid alt="Looking at the pvalue distributions for the attrition (figure 2)" loading="eager" path="assets/img/DS_6306_Project_2/Group_E/pic2.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    2 different plots of the p-value distribution
</div>

From the plot above, we can see that the top 5 highly significant values with respect to the response variable Attrition in terms of its relative most significant to least significant variables are OverTime, JobInvolvement, JobSatisfaction, NumCompaniesWorked, YearsSinceLastPromotion

### Forward selection on AUC for the attrition model (numeric variables only, for KNN)

I plan on using the same strategy as for our regression model. This time I shall look at the Area under the curve (AUROC), which represents of the trade-off between the true positive rate (sensitivity) and the false positive rate (1 - specificity) as the classification threshold is varied. I'll be looking for the variables that provides the maximum auroc using a general logistiic model

### Getting the 1st variable

I'm looking for the perfect (Attrition ~ dependent variable) combination to get the maximum auroc score

<details class="code-fold" markdown="1">
<summary>Show R code</summary>

```r
Talent_Clean <- Talent_Train %>% select(Age, DailyRate, DistanceFromHome, Education, EmployeeCount, EmployeeNumber, EnvironmentSatisfaction, HourlyRate, JobInvolvement, JobLevel, JobSatisfaction, MonthlyIncome, MonthlyRate, NumCompaniesWorked, PercentSalaryHike, PerformanceRating, RelationshipSatisfaction, StandardHours, StockOptionLevel, TotalWorkingYears, TrainingTimesLastYear, WorkLifeBalance, YearsAtCompany, YearsInCurrentRole, YearsSinceLastPromotion, YearsWithCurrManager, Over18_binary, Attrition) #selecting only numeric variables

# Forward Selection # 1
set.seed(21)
vars <- names(Talent_Clean)
vars <- vars[vars!="Attrition"] #iterating thru variables that are not "Attrition"
vars <- vars[vars != "MonthlyIncome"] #iterating thru variables that are not "MonthlyIncome"
num_vars <- length(vars)
var_aucs <- data.frame("vars" = vars)
num_folds <- 10
for (j in 1:num_vars) {
  var <- vars[j]
  #print(var)
  folds <- createFolds(Talent_Clean$Attrition, k = num_folds)
  auc_scores <- numeric(num_folds)
  for (i in 1:num_folds) {
    train_indices <- unlist(folds[-i])
    test_indices <- unlist(folds[i])
    train <- Talent_Clean[train_indices, ]
    test <- Talent_Clean[test_indices, ]
    form <- as.formula(paste("Attrition ~ ",var,sep=""))
    model <- glm(form, data = train, family = "binomial")
    predictions <- predict(model, newdata = test, type = "response")
    roc <- roc(response=test$Attrition,predictor=predictions,levels=c("No", "Yes"),direction = ">")
    auc_scores[i] <- auc(roc) #calculating the area under the curve
  }
  var_aucs$auc[var_aucs$var == var] <- mean(auc_scores)
}

max_auc = max(var_aucs$auc) #finding the max_auc
max_auc_variable <- var_aucs$vars[which.max(var_aucs$auc)]

cat("optimum Variable is ", max_auc_variable, " with a maximum auc of ", max_auc)s
```

</details>

> optimum Variable is StockOptionLevel with a maximum auc of 0.6940313

### Getting the second variable

Next I'll look for the optimum variable to add to our classification model (Attrition ~ TotalWorkingYears + StockOptionLevel) in order to provide the maximum auc score

<details class="code-fold" markdown="1">
<summary>Show R code</summary>

```r
# Forward Selection # 2
set.seed(21)
vars <- names(Talent_Clean)
vars <- vars[vars!="Attrition"] #iterating thru variables that are not "Attrition"
vars <- vars[vars != "MonthlyIncome"] #iterating thru variables that are not "MonthlyIncome"
vars <- vars[vars != "TotalWorkingYears "] #iterating thru variables that are not "TotalWorkingYears "
num_vars <- length(vars)
var_aucs <- data.frame("vars" = vars)
num_folds <- 10
numks = 60
for (j in 1:num_vars) {
  var <- vars[j]
  #print(var)
  folds <- createFolds(Talent_Clean$Attrition, k = num_folds)
  auc_scores <- numeric(num_folds)
  for (i in 1:num_folds) {
    train_indices <- unlist(folds[-i])
    test_indices <- unlist(folds[i])
    train <- Talent_Clean[train_indices, ]
    test <- Talent_Clean[test_indices, ]
    form <- as.formula(paste("Attrition ~ TotalWorkingYears  + ",var,sep=""))
    model <- glm(form, data = train, family = "binomial")
    predictions <- predict(model, newdata = test, type = "response")
    roc <- roc(response=test$Attrition,predictor=predictions,levels=c("No", "Yes"),direction = ">")
    auc_scores[i] <- auc(roc) #calculating the area under the curve
  }
  var_aucs$auc[var_aucs$var == var] <- mean(auc_scores)
}

max_auc = max(var_aucs$auc) #finding the max_auc
max_auc_variable <- var_aucs$vars[which.max(var_aucs$auc)]

cat("optimum Variable is ", max_auc_variable, " with a maximum auc of ", max_auc)
```

</details>

> optimum Variable is StockOptionLevel with a maximum auc of 0.6940313

### Getting the third variable

Next I'll look for the optimum variable to add to our classification model (Attrition ~ TotalWorkingYears + StockOptionLevel) in order to provide the maximum auc score

<details class="code-fold" markdown="1">
<summary>Show R code</summary>

```r
# Forward Selection # 3
set.seed(21)
vars <- names(Talent_Clean)
vars <- vars[vars!="Attrition"] #iterating thru variables that are not "Attrition"
vars <- vars[vars != "MonthlyIncome"] #iterating thru variables that are not "MonthlyIncome"
vars <- vars[vars != "TotalWorkingYears "] #iterating thru variables that are not "TotalWorkingYears "
vars <- vars[vars != "StockOptionLevel"] #iterating thru variables that are not "JobRole"
num_vars <- length(vars)
var_aucs <- data.frame("vars" = vars)
num_folds <- 10
numks = 60
for (j in 1:num_vars) {
  var <- vars[j]
  #print(var)
  folds <- createFolds(Talent_Clean$Attrition, k = num_folds)
  auc_scores <- numeric(num_folds)
  for (i in 1:num_folds) {
    train_indices <- unlist(folds[-i])
    test_indices <- unlist(folds[i])
    train <- Talent_Clean[train_indices, ]
    test <- Talent_Clean[test_indices, ]
    form <- as.formula(paste("Attrition ~ TotalWorkingYears  + StockOptionLevel + ",var,sep=""))
    model <- glm(form, data = train, family = "binomial")
    predictions <- predict(model, newdata = test, type = "response")
    roc <- roc(response=test$Attrition,predictor=predictions,levels=c("No", "Yes"),direction = ">")
    auc_scores[i] <- auc(roc) #calculating the area under the curve
  }
  var_aucs$auc[var_aucs$var == var] <- mean(auc_scores)
}

max_auc = max(var_aucs$auc) #finding the max_auc
max_auc_variable <- var_aucs$vars[which.max(var_aucs$auc)]

cat("optimum Variable is ", max_auc_variable, " with a maximum auc of ", max_auc)
```

</details>

> optimum Variable is JobInvolvement with a maximum auc of 0.7157045

### Sensitivity and specificity

Next I'll be looking at the sensitivity and specificity metric of our classification model using k- Nearest Neighbors (KNN) and Naive Bayes

### Naive Bayes

#### Finding the threshold

finding the best threshold for our Naive Bayes Model, in order to provide the best metric. The threshold will be gotten from the maximum F1 score, which is a metric used to evaluate the performance of a binary classification model. It combines both precision and recall into a single metric and is particularly useful when the classes are imbalanced.

<details class="code-fold" markdown="1">
<summary>Show R code</summary>

```r
set.seed(123)
Talent_Clean <- Talent_Train %>% select(Attrition, TotalWorkingYears, StockOptionLevel, JobInvolvement) #selecting our variables
trainIndices <- sample(seq(1:length(Talent_Clean$Attrition)), round(0.7 * length(Talent_Clean$Attrition)))
train <- Talent_Clean[trainIndices, ]
test <- Talent_Clean[-trainIndices, ]

train$Attrition <-factor(train$Attrition, levels=c('Yes','No')) #factoring the response variable
test$Attrition <-factor(test$Attrition, levels=c('Yes','No')) #factoring the response variable

naive_bayes_model <- naiveBayes(Attrition ~ TotalWorkingYears  + StockOptionLevel + JobInvolvement, data = train)

# Make predictions on the test set
predictions <- predict(naive_bayes_model, test)

# Evaluate model performance
conf_matrix <- confusionMatrix(predictions, test$Attrition)

# Print the confusion matrix
#print(conf_matrix)

# Adjust label levels for better interpretation
test$Attrition <- relevel(test$Attrition, ref = "No")

# Make predictions with probabilities
predictions_with_probs <- predict(naive_bayes_model, test, type = "raw")

# Get probabilities of the positive class ("Yes")
probs <- predictions_with_probs[, "Yes"]

# Define a new threshold
new_threshold <- 0.5

# Create new labels based on the new threshold
new_labels <- ifelse(probs > new_threshold, "Yes", "No")

# Convert the predicted labels to a factor with the same levels as the actual labels
new_labels_factor <- factor(new_labels, levels = levels(test$Attrition))

# Evaluate model performance with the new threshold
new_conf_matrix <- confusionMatrix(new_labels_factor, test$Attrition)

# Print the confusion matrix with the new threshold
#print(new_conf_matrix)

# Calculate the macro F1 score with the new threshold
macro_f1_new_threshold <- mean(c(new_conf_matrix[4]$byClass["F1"], conf_matrix[4]$byClass["F1"]))
```

</details>

> Our optimum threshold is 0.5725983

#### Looking at the Metrics

<details class="code-fold" markdown="1">
<summary>Show R code</summary>

```r
test$Attrition = relevel(test$Attrition, ref = 'Yes')

# Train a Naive Bayes model
naive_bayes_model <- naiveBayes(Attrition ~ TotalWorkingYears  + StockOptionLevel + JobInvolvement, data = train)

# Get predicted probabilities for the positive class (assuming 'Yes' is the positive class)
predicted_probabilities <- predict(naive_bayes_model, test, type = "raw")[, "Yes"]

# Define threshold
threshold <- macro_f1_new_threshold  # Adjust as needed

# Adjust predictions based on threshold
adjusted_predictions <- ifelse(predicted_probabilities > threshold, "Yes", "No")

# Evaluate model performance
adjusted_predictions <- factor(adjusted_predictions, levels = levels(test$Attrition))

conf_matrix <- confusionMatrix(table(adjusted_predictions, test$Attrition))
print(conf_matrix)

accuracy_nb <- conf_matrix$overall["Accuracy"]
sensitivity_nb <- conf_matrix$byClass["Sensitivity"]
specificity_nb <- conf_matrix$byClass["Specificity"]
```

</details>

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid alt="Looking at the Metrics (figure 1)" loading="eager" path="assets/img/DS_6306_Project_2/Conf_Matrix/Naive_Bayes.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    The confusion Matrix for the Naive Bayes Model
</div>

The sensitivity and specificity fell short of our target of > 0.6 for both sensitivity and specificity. We got sensitivity to be : 0.1153846 (This is due to the low amount of Nos.) , and specificity as : 0.9856459. Accuracy is 0.5505 and Pvalue is 1.94e-09 < sig level, which is Highly significant

### KNN model

#### Sensitivity and specificity for KNN, using undersampling

I plan on using undersampling to get our metrics, due to the imbalance between Yes and No attrition rates. I am basically reducing the No dataset, in order to match the Yes dataset, to improve sensitivity.

<details class="code-fold" markdown="1">
<summary>Show R code</summary>

```r
set.seed(123)
Talent_Clean <- Talent_Train %>% select(Attrition, TotalWorkingYears, StockOptionLevel, JobInvolvement, ID) #selecting our variables
trainIndices <- sample(seq(1:length(Talent_Clean$Attrition)), round(0.7 * length(Talent_Clean$Attrition)))
train <- Talent_Clean[trainIndices, ]
test <- Talent_Clean[-trainIndices, ]

# Sample only a subset of 'No' instances to balance the classes
OnlyNoAttrition <- train %>% filter(Attrition == "No")
numYesAttrition <- sum(train$Attrition == "Yes")
sampled_NoAttrition <- OnlyNoAttrition[sample(seq(1, nrow(OnlyNoAttrition), 1), numYesAttrition),]

# Combine sampled 'No' instances with 'Yes' instances to create a balanced dataset
balanced_data <- rbind(train %>% filter(Attrition == "Yes"), sampled_NoAttrition)

classifications = knn(balanced_data[,2:4],train[,2:4], balanced_data[,1], prob = TRUE, k = 5) # using the F (original dataset) as the test set

table(classifications,train[,1])
CM = confusionMatrix(table(classifications,train[,1]), mode = "everything")

#Get Macro F1
train$Attrition = relevel(train$Attrition, ref = 'Yes')
classifications = knn(train[,2:4],train[2:4],train[,1], prob = TRUE, k = 5)
CM_Yes = confusionMatrix(table(classifications,train[,1]), mode = "everything") # Note F1

train$Attrition = relevel(train$Attrition, ref = 'No')
classifications = knn(train[,2:4],train[2:4],train[,1], prob = TRUE, k = 5)
CM_No = confusionMatrix(table(classifications,train[,1]), mode = "everything") # Note F1

Macro_F1_Under = mean(c(CM_Yes[4]$byClass["F1"],CM_No[4]$byClass["F1"]))
Macro_F1_Under
```

</details>

> The threshold is 0.5892183

#### Testing the metric

Testing for sensitivity and specificity

<details class="code-fold" markdown="1">
<summary>Show R code</summary>

```r
test$Attrition = relevel(test$Attrition, ref = 'Yes')

knn_model <- knn(balanced_data[,2:4], test[, c(2,3,4)], balanced_data[,1], prob = TRUE,  k = 5)

CM = confusionMatrix(table(knn_model,test[,1]), mode = "everything")
CM

# Evaluate model performance

accuracy_knn <- CM$overall["Accuracy"]
sensitivity_knn <- CM$byClass["Sensitivity"]
specificity_knn <- CM$byClass["Specificity"]

test$predictions <- knn_model

# Generation our regression for the test dataset
new_data <- test %>% select(predictions, ID)

new_data <- new_data[order(new_data$ID), ]
```

</details>

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid alt="Testing the metric (figure 1)" loading="eager" path="assets/img/DS_6306_Project_2/Conf_Matrix/KNN.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    The confusion Matrix for the KNN Model
</div>

### Model comparison

#### Metrics comparison

comparing accuracy, sensitivity and specificity metric for both KNN and naive bayes

<details class="code-fold" markdown="1">
<summary>Show R code</summary>

```r
results_nb <- data.frame(Accuracy = accuracy_nb, Sensitivity = sensitivity_nb, Specificity =  specificity_nb, total = sensitivity_nb + specificity_nb)
avg_nb = colMeans(results_nb[, c("Accuracy", "Sensitivity", "Specificity", "total")])
avg_nb

results_knn <- data.frame(Accuracy = accuracy_knn, Sensitivity = sensitivity_knn, Specificity = specificity_knn, total = sensitivity_knn + specificity_knn)
avg_knn = colMeans(results_knn[, c("Accuracy", "Sensitivity", "Specificity", "total")])
avg_knn


#Getting the barchart plots for average analysis
combined_results <- cbind(data.frame(avg_nb), data.frame(avg_knn))


barplot(t(combined_results[1, ]), beside = TRUE, col = rainbow(2),
        main = "Accuracy Comparison of both knn and nb models",
        ylab = "Accuracy (%)", legend.text = names(combined_results[1, ]))

barplot(t(combined_results[2, ]), beside = TRUE, col = rainbow(2),
        main = "Sensitivity Comparison of both knn and nb models",
        ylab = "Sensitivity (%)", legend.text = names(combined_results[2, ]))

barplot(t(combined_results[3, ]), beside = TRUE, col = rainbow(2),
        main = "Specificity Comparison of both knn and nb models",
        ylab = "Specificity (%)", legend.text = names(combined_results[3, ]))

barplot(t(combined_results[4, ]), beside = TRUE, col = rainbow(2),
        main = "Specificity Comparison of both knn and nb models",
        ylab = "Specificity + Sensitivity (%)", legend.text = names(combined_results[4, ]))
```

</details>

<div class="row justify-content-sm-center">
    <div class="col-sm-4 mt-3 mt-md-0" >
        {% include figure.liquid alt="Metrics comparison (figure 1)" loading="eager" path="assets/img/DS_6306_Project_2/Group_F/pic1.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm-4 mt-3 mt-md-0" >
        {% include figure.liquid alt="Metrics comparison (figure 2)" loading="eager" path="assets/img/DS_6306_Project_2/Group_F/pic2.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm-4 mt-3 mt-md-0" >
        {% include figure.liquid alt="Metrics comparison (figure 3)" loading="eager" path="assets/img/DS_6306_Project_2/Group_F/pic3.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm-4 mt-3 mt-md-0" >
        {% include figure.liquid alt="Metrics comparison (figure 4)" loading="eager" path="assets/img/DS_6306_Project_2/Group_F/pic4.PNG" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
   Plots comparing the accuracy, sensitivity, specificity, and specificity + sensitivity metrics for both kNN and NaiveBayes model. 
</div>

- Knn has a higher sensitivity and specificity + sensitivity.
- Naïve Bayes has higher specificity and accuracy.

## Conclusion

### Tips for Frito Lay

- Try providing more incentives to employees to improve retention rate
- Let the stock options match the amount of years the employees worked

### Future work

- Try to improve sensitivity values for the classification model.
- Explore other variables that might affect the classification and prediction model.
- Try using other classification techniques to predict my model like Support Vector Machine (SVM) or RandomForest

### Relevant files

Here are the list of relevant files related to the project

- [Project Description](https://github.com/DamilolaOwolabi/DS_6306_Project_2/blob/main/CaseStudy2%20Spring%202024.docx)
- csv files
  - [Attrition.csv file](https://github.com/DamilolaOwolabi/DS_6306_Project_2/blob/main/Case2PredictionsOwolabi%20Attrition.csv)
  - [Salary.csv file](https://github.com/DamilolaOwolabi/DS_6306_Project_2/blob/main/Case2PredictionsOwolabi%20Salary.csv)
- [Project's pdf file](https://github.com/DamilolaOwolabi/DS_6306_Project_2/blob/main/DS%206306%20Final%20Project%202.pdf)
- [Project's Rmd File](https://github.com/DamilolaOwolabi/DS_6306_Project_2/blob/main/DS6306_Project_2.Rmd)
