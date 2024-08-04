---
layout: page
title: House Prices Analysis
description: The project aims to predict the sale prices of homes in Ames, Iowa using existing data, and programs like R and SAS.
img: assets/img/DS_6371_Final_Project/Thumbnail/DS_6371_Final_Project_Thumbnail.jpeg
importance: 2
category: school
---


Please try out my interactive Rshinyapp to experience my model’s prediction rate : [RShiny](https://iachavez97.shinyapps.io/RealEstateApp/)

Here is the link to other files related to the project in my GitHub Repository: [GitHub](https://github.com/DamilolaOwolabi/DS-6371-Project)


# INTRODUCTION

The goal of this project is to predict the sale price of homes in Ames, Iowa using existing data. We strive
to utilize various statistical and data analytical techniques in order to derive the best predictive model for
the sale price


## DATA DESCRIPTIONS

We received this data from a study of residential homes in Ames, Iowa. The data set contains 383 rows of values with 79 different explanatory variable columns. You can find out more regarding the dataset and
how it was pulled in the kaggle for house prices - advanced regression techniques. For respect to the
analysis of question 1 the three main variables that I assessed were the Neighborhood, sales price, and GrLivArea variables. The variables used in the second analysis are SalePrice, GrLivArea, and the
OverallQual.




# Analysis Question 1


## Restatement of Problem

For our first analysis our objective was to get an estimate of sale prices of houses are related to sq
footage of living area in houses for three neighborhoods which are NAmes, Edwards, and BrkSide.
Additionally, we were requested to provide the estimates if they differ based on the neighborhood and
provide confidence intervals for each of the different neighborhoods. We will also be providing evidence
that our model fits the assumptions and how we observed outliers/influential observations.


## Build and Fit the Mode

In building my model for the analysis I used a multiple linear regression model with Sale price being the response variable and GrLivArea and neighborhood being the explanatory variables. Below we see a scatterplot of living area for the 3 neighborhood vs the sale price of each home. I created this scatterplot to get an idea for the distribution of the points and see if there are any outliers, and we can see that there are two outliers from the same neighborhood Edwards. After analysis and looking at residual plots we decided to remove these two outlier points that are in the edwards neighborhood because they appear to be incorrectly assigned and the fact that they are in the same neighborhood helps us come to that conclusion as well.

<div class="row justify-content-sm-center">
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/DS_6371_Final_Project/pictures/pic1.png" title="example image" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/DS_6371_Final_Project/pictures/pic2.png" title="example image" class="img-fluid rounded z-depth-1" %}
  </div>
</div>

<div class="caption">
    Scatterplots before transformations vs. post log transformation and removal of outliers.
</div>


## Checking Assumptions


#### Residual Plots 

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic36.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    Original plot of the linear model before transformations or removing of outliers
</div>

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic37.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    Plot of the residuals after transformations and removing of outliers
</div>

The residual plots will be in the index, through the cooks d plots we were able to identify the two values that were outliers and identified them as data point 131 and 399. We removed these and they showed a much better fit for the model and a more normalized distribution of our residual plots.

#### Influential point analysis (Cook’s D and Leverage)

<div class="row justify-content-sm-center">
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/DS_6371_Final_Project/pictures/pic3.png" title="example image" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/DS_6371_Final_Project/pictures/pic4.png" title="example image" class="img-fluid rounded z-depth-1" %}
  </div>
</div>

<div class="caption">
    Original cooks D plot vs. New cooks D plot. We can see that the cooks D levels have gone down significantly.
</div>


## Make sure to address each assumption.

We can see that after our removing of outliers and transformations that the cooks d as well as our residuals look much better compared to the original model. So we are now able to move forward with this model and show how sale price is related to GrLivArea compared to each neighborhood.


## Comparing Competing Models

Adj R  - the adjusted R^2 I got for my final model is .5002
Internal CV Press - the internal CV press number I got was 1437833896.


## Parameters

#### Estimates

Here we see the summary of our model.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic5.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    Summary of the model
</div>


#### Interpretation

Above we can see the table for our multiple linear regression model. Since we ran a log-log transformation we can interpret how a percent change in the GrLivArea variable will affect our final sale price. For NeighborhoodEdwards a 1% in GrLivArea the sale price will increase by approximately .011%, for NeighborhoodNAmes a 1% increase in the GrLivArea will increase the final sale price by approximately .13%, and for NeighborhoodBrkSide a 1% increase in the GrLivArea will increase the sale price by .60%


#### Confidence Intervals

- The confidence interval for NeighborhoodEdwards is (-.077, .049)
- The confidence interval for NeighborhoodNAmes is (.072, .19)
- The confidence interval for NeighborhoodBrkSide is (.53, .66)


## Conclusion

We can see from our original graphs that the residuals and the plot had outliers so we assessed them and were able to get more normally distributed plots after assessing the outliers and performing our transformations. We can see from our graphs as well that there appears to be a positive relationship between the GrLivArea and the sales price of homes and we were able to quantify the percent increase of the homes sales price based on the GrLivArea. We can see as well that the NAmes neighborhood has the highest value homes with BrkSide being in second and Edwards being the least valuable of the three neighborhoods.


## R Shiny: Price v. Living Area Chart 

In our [Rshiny app]( https://iachavez97.shinyapps.io/RealEstateApp/) we are showing a scatterplot of the relation between sales price of homes and the living area. Additionally, it is able to be separated by each of the 3 different neighborhoods NAmes, BrkSide, and Edwards.




# Analysis Question 2


## Restatement of Problem

This analysis hopes to build the best predictive model needed to predict future sale prices of homes in Ames, Iowa. We plan on doing that by looking at different types of regression models (Simple Linear Regression, Multiple Linear Regression, and Custom Multiple Regression), choosing the best model for each regression type by analyzing the various model selections and making a final decision based on the adjusted r-squared, CVpress and Kaggle score.


## Model Selection


#### 1.   Simple Linear Regression

    ~~~ SAS
    
    data NewtrainData;
    set trainData;
    if _n_ = 1299 then delete;
    if _n_ = 524 then delete;
    run;
    
    proc print data = NewtrainData;
    run;
    
    proc reg data = NewtrainData;
    model SalePrice = GrLivArea;
    run;

    *Running the model selection with the train/test split;
    *running the forward selection;
    proc glmselect data = NewtrainData plots = all;
    partition fraction(test= 0.2);
    model SalePrice = GrLivArea /selection = Forward(stop=CV) cvmethod=random(5) stats = adjrsq CVDETAILS;
    run;
    
    *running the Backward selection;
    proc glmselect data = NewtrainData plots = all;
    partition fraction(test= 0.2);
    model SalePrice = GrLivArea /selection = Backward(stop=CV) cvmethod=random(5) stats = adjrsq CVDETAILS;
    run;
    
    *running the Stepwise selection;
    proc glmselect data = NewtrainData plots = all;
    partition fraction(test= 0.2);
    model SalePrice = GrLivArea /selection = Stepwise(stop=CV) cvmethod=random(5) stats = adjrsq CVDETAILS;
    run;
    ~~~
    
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic6.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
        <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic7.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
        <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic8.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    Stepwise vs. Forward vs. Backward plots
</div>

**Decision:**  Given  that  the  adjusted R-squared for the forward model selection is higher (0.5412). We will go ahead with that instead.


#### 2.   Multiple Linear Regression

    ~~~ SAS
    *Multiple Linear Regression;
    proc corr; run;
    symbol c=blue v= dot;
    proc sgscatter data = trainData;
    matrix SalePrice GrLivArea FullBath;
    
    proc reg data = trainData;
    model SalePrice = GrLivArea FullBath;
    run;
    
    data NewtrainData2;
    set trainData;
    if _n_ = 1299 then delete;
    if _n_ = 524 then delete;
    run;
    
    proc print data = NewtrainData2;
    run;
    
    proc reg data = NewtrainData2;
    model SalePrice = GrLivArea FullBath;
    run;
    
    *running the forward selection;
    proc glmselect data = NewtrainData2 plots = all;
    partition fraction(test= 0.2);
    model SalePrice = GrLivArea FullBath /selection = Forward(select=CV choose=CV stop=CV) cvmethod=random(5) stats = adjrsq CVDETAILS;
    run;
    
    *running the Backward selection;
    proc glmselect data = NewtrainData2 plots = all;
    partition fraction(test= 0.2);
    model SalePrice = GrLivArea FullBath /selection = Backward(stop=CV) cvmethod=random(5) stats = adjrsq CVDETAILS;
    run;
    
    *running the Stepwise selection;
    proc glmselect data = NewtrainData2 plots = all;
    partition fraction(test= 0.2);
    model SalePrice = GrLivArea FullBath /selection = Stepwise(stop=CV) cvmethod=random(5) stats = adjrsq CVDETAILS;
    run;
    ~~~ 

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic9.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
        <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic10.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
        <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic11.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    Stepwise vs. Forward vs. Backward plots
</div>

**Decision:** Given that the adjusted R-squared for the stepwise model selection is higher (0.5712). We will go ahead with that instead.


#### 3.   Custom Multiple Linear Regression (SalePrice ~ GrLivArea + OverallQual)

    ~~~ SAS
    *Custom Multiple Linear Regression (SalePrice ~ GrLivArea + OverallQual);
    proc corr; run;
    symbol c=blue v= dot;
    proc sgscatter data = trainData;
    matrix SalePrice GrLivArea OverallQual;
    
    proc reg data = trainData;
    model SalePrice = GrLivArea OverallQual;
    run;
    
    data NewtrainData3;
    set trainData;
    if _n_ = 1299 then delete;
    if _n_ = 524 then delete;
    run;
    
    proc print data = NewtrainData3;
    run;
    
    proc reg data = NewtrainData3;
    model SalePrice = GrLivArea OverallQual;
    run;
    
    *running the forward selection;
    proc glmselect data = NewtrainData3 plots = all;
    partition fraction(test= 0.2);
    model SalePrice = GrLivArea OverallQual /selection = Forward(select=CV choose=CV stop=CV) cvmethod=random(5) stats = adjrsq CVDETAILS;
    run;
    
    *running the Backward selection;
    proc glmselect data = NewtrainData3 plots = all;
    partition fraction(test= 0.2);
    model SalePrice = GrLivArea OverallQual /selection = Backward(stop=CV) cvmethod=random(5) stats = adjrsq CVDETAILS;
    run;
    
    *running the Stepwise selection;
    proc glmselect data = NewtrainData3 plots = all;
    partition fraction(test= 0.2);
    model SalePrice = GrLivArea OverallQual /selection = Stepwise(stop=CV) cvmethod=random(5) stats = adjrsq CVDETAILS;
    run;
    ~~~
    
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic12.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
        <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic13.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
        <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic14.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    Stepwise vs. Forward vs. Backward plots
</div>

**Decision:** Given that the adjusted R-squared for the backward model selection is higher (0.7480). We will go ahead with that instead.


## Checking Assumptions


#### 1.  Simple Linear Regression

**Residual Plots**

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic15.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
        <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic16.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic17.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
        <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic18.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    Initial vs. Final Residual plots
</div>

Judging from the scatterplot of residuals, there is no evidence against the normality of the sales price conditional on the General living area. There is also no evidence against the linear trend between the sales price versus the General Living Area because the data points converge around the line. We were able to remove the 2 extreme points that were affecting the model using the cook’s D plot. There are 2 more outliers in the residual scatterplot towards the upper right, they were left behind because they might be influential to the model and they are closer to the cluster than the previous 2 datapoints


**Cooks D-Plot**

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic19.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
        <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic20.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    Initial vs. Final Cook's D plot
</div>

Initial: The data points 1299 and 524 are 2 high values in the model that might affect the regression fit, which should be removed.

Final: The cook’s D plot hows the influence of each individual point on the fitted regression line. The previous 2 points with extremely high values have been identified and removed. The two highest values of the line (691, and 1182) have been identified on the residual plot and verified to not affect the model’s p-value.


**Leverage Plot**

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic21.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
        <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic22.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    Initial vs. Final Leverage Plot
</div>

Initial: The leverage shows that there 2 really high influentual points in the data (524, and 1299) that are affecting the plot to veer towards Rstudent > 0 instead of being spread apart.

Final: After the 2 influential plots were removed, the plots show to be more spread apart, hence providing a better fit.


#### 2.   Multiple Linear Regression

**Residual Plots**

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic23.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
        <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic24.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    Initial vs. Final Residual plots
</div>

Judging from the scatterplot of residuals, there is no evidence against the normality of the sales price conditional on the General living area and the number of full baths in the home. There is also no evidence against the linear trend between the sales price versus the General Living Area the number of full baths in the home because the data points converge around the line. We were able to remove the 2 extreme points that were affecting the model using the cook’s D plot


**Cooks D-Plot**

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic25.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
        <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic26.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    Initial vs. Final Cook's D plot
</div>

Initial: The data points 1299 and 524 are 2 high values in the model that might affect the regression fit, which should be removed.

Final: The cook’s D plot hows the influence of each individual point on the fitted regression line. The previous 2 points with extremely high values have been identified and removed. The two highest values of the line (691, and 1182) have been identified on the residual plot and verified to not affect the model’s p-value.


**Leverage Plot**

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic27.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
        <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic28.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    Initial vs. Final Cook's Leverage Plot
</div>

Initial: The leverage shows that there 2 really high influentual points in the data (524, and 1299) that are affecting the plot to veer towards Rstudent > 0 instead of being spread apart.

Final: After the 2 influential plots were removed, the plots show to be more spread apart, hence providing a better fit.


#### 3.   Custom Multiple Linear Regression

**Residual Plots**

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic29.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
        <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic30.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    Initial vs. Final Residual plots
</div>

Judging from the scatterplot of residuals, there is no evidence against the normality of the sales price conditional on the General living area and the overall quality of the homes. There is also no evidence against the linear trend between the sales price versus the General Living Area and the overall quality of the homes, because the data points converge around the line.We were able to remove the 2 extreme points that were affecting the model using the cook’s D plot


**Cooks D-Plot**

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic31.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
        <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic32.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    Initial vs. Final Cook's D plot
</div>

Initial: The data points 1299 and 524 are 2 high values in the model that might affect the regression fit, which should be removed.

Final: The cook’s D plot hows the influence of each individual point on the fitted regression line. The previous 2 points with extremely high values have been identified and removed. The two highest values of the line (691, and 1182) have been identified on the residual plot and verified to not affect the model’s p-value.


**Leverage Plot**

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic33.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
        <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic34.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    Initial vs. Final Leverage Plot
</div>

Initial: The leverage shows that there 2 really high influentual points in the data (524, and 1299) that are affecting the plot to veer towards Rstudent > 0 instead of being spread apart.

Final: After the 2 influential plots were removed, the plots show to be more spread apart, hence providing a better fit.


## Comparing Competing Models

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/DS_6371_Final_Project/pictures/pic35.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

<div class="caption">
    Model Comparison Table
</div>

From the comparison above we can see that the custom MLR model of (SalePrice ~ GrLivArea + OverallQual) has the best and lowest Kaggle score of 0.2281. This is because the model has a high adjusted R-squared and a lower CV press compared to the rest.


# Conclusion

Based on the model selection analysis, the Kaggle scores, and the adjusted R-squared of each model shown in the table above, the custom MLR Model with a backward model selection is the best model to predict sale prices for homes in Ames, Iowa.


.

