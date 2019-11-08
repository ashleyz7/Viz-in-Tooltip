'use strict';

(function() {

  let allData = 'no data'
  let data = "no data";
  let svgContainer = ""; // keep SVG reference in global scope

  const msm = {
    width: 1000,
    height: 800,
    marginAll: 50,
    marginLeft: 50,
  }
  const smallMsm = {
    width: 500,
    height: 500,
    marginAll: 80,
    marginLeft: 60
  }
  // load data and make scatter plot after window loads
  window.onload = function() {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 1000)
      .attr('height', 800);
    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("gapminder.csv")
      .then((data) => makeScatterPlot(data));
    
    
  }

  // make scatter plot with trend line
  function makeScatterPlot(csvData) {
    allData = csvData
    data = csvData.filter(function(d) {return '1980' == d['year'] && d['ferfility'] != 'NA' && d['life_expectancy'] != 'NA';}) // assign data as global variable
   

    // get arrays of fertility rate data and life Expectancy data
    let fertility_rate_data = data.map((row) => parseFloat(row["fertility"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));

    // find data limits
    let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits, "fertility", "life_expectancy", svgContainer, msm);

    // plot data as points and add tooltip functionality
    plotData(mapFunctions);

    // draw title and axes labels
    makeLabels(svgContainer, msm, "Life Expectency vs Fertility",'Fertility', 'Life Expectancy');

    

  }

  // make title and axes labels
  function makeLabels(container, thisMsm, title, x, y) {
    container.append('text')
        .attr('x', (thisMsm.width - 2 * thisMsm.marginAll) / 2 - 90)
        .attr('y', thisMsm.marginAll / 2 + 10)
        .style('font-size', '14pt')
        .text(title);

    container.append('text')
      .attr('x', (thisMsm.width - 2 * thisMsm.marginAll) / 2 - 20)
      .attr('y', thisMsm.height - 20)
      .style('font-size', '10pt')
      .text(x);

    container.append('text')
      .attr('transform', 'translate(10,' + (thisMsm.height / 2 + 50) + ') rotate(-90)')
      .style('font-size', '10pt')
      .text(y);
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map) {
    // get population data as array
    let pop_data = data.map((row) => +row["population"]);
    let pop_limits = d3.extent(pop_data);
    // make size scaling function for population
    let pop_map_func = d3.scaleLinear()
      .domain([pop_limits[0], pop_limits[1]])
      .range([3, 40]);

    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    // make tooltip
    let div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

    let toolChart = div.append('svg')
    .attr('width', 500)
    .attr('height', 500)

    // append data to SVG and plot as points
    var dots = svgContainer.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
        .attr('cx', xMap)
        .attr('cy', yMap)
        .attr('r', (d) => pop_map_func(d["population"]))
        .attr('fill', 'white')
        .attr('stroke', '#4286f4')
        .attr('stroke-width', '2')
        // add tooltip functionality to points
        .on("mouseover", (d) => {
          toolChart.selectAll('*').remove()
          div.transition()
            .duration(500)
            .style("opacity", .9)
          plotPopulation(d.country, toolChart)
          // div.html('Fertility: ' + d['fertility_rate'] + '<br/>' + 'Life Expectancy: ' + d['life_expectancy'] + '<br/>' 
          // + 'Population: ' + numberWithCommas(d["pop_mlns"]*1000000) + "<br/>" + 'Year: ' + d['time'] + '<br/>' + 'Country: ' + d['location'])
          div.style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY) + "px");
        })
        .on("mouseout", (d) => {
          div.transition()
            .duration(500)
            .style("opacity", 0);
        });
    //  dots
    //   .filter(function(d) {return '1980' != d['year'];})
    //   .attr("display", 'none');
            
    //  dots
    //   .filter(function(d) {return '1980' == d['year'];})
    //   .attr("display", 'inline');
  }

  // draw the axes and ticks
  function plotPopulation(country, toolChart) {
    let countryData = allData.filter((row) => {return row.country == country && row.year != 'NA' && row.population != 'NA'})
    let population = countryData.map((row) => parseInt(row["population"]));
    let year = countryData.map((row) => parseInt(row["year"]));

    let axesLimits = findMinMax(year, population);
    let mapFunctions = drawAxes(axesLimits, "year", "population", toolChart, smallMsm);
    toolChart.append("path")
        .datum(countryData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
                    .x(function(d) { return mapFunctions.xScale(d.year) })
                    .y(function(d) { return mapFunctions.yScale(d.population) }))
    makeLabels(toolChart, smallMsm, country, "Year", "Population");
  }

  function drawAxes(limits, x, y, container, thisMsm) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 0.5, limits.xMax + 0.5]) // give domain buffer room
      .range([0 + thisMsm.marginAll, thisMsm.width - thisMsm.marginAll]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    container.append("g")
      .attr('transform', 'translate(0, ' + (thisMsm.height - thisMsm.marginAll) + ')')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
      .range([0 + thisMsm.marginAll, thisMsm.height - thisMsm.marginAll])

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    container.append('g')
      .attr('transform', 'translate(' + thisMsm.marginAll + ', 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }

  // format numbers
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }




})();
