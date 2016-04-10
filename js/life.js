$(function() {
  
  $( "#datepicker" ).datepicker({
    defaultDate: '01/01/1990',
    changeYear: true,
    changeMonth: true,
    showMonthAfterYear: true,
    minDate: "-90Y", 
    maxDate: "-1D" 
  });

  d3.select("#viewBtn")
    .on("click", function() {
      var date = document.getElementById("datepicker").value;
      if (date.length < 1) {
        return;
      }
      age = calcAge(date);
      input = true;
      exit();
    });

  var counter;
  var age = 4680;
  var input = false;
  var formatNumber = d3.format(",d");
  var svg = d3.select("svg");
  var width = +svg.attr("width"),
      height = +svg.attr("height");

  var groupSpacing = 3,
      cellSpacing = 1,
      cellSize = 8,
      offset = 10;

  var updateDuration = 125,
      updateDelay = updateDuration / 500;

  var axisScale = d3.scale.linear()
    .domain([0, 85])
    .range([0, (720 + offset + 35)]); //720 = 8px * 90

  var yAxis = d3.svg.axis()
    .scale(axisScale)
    .orient("left")
    .ticks(17);

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + (offset + 20) +  "," + (offset + 35) + ")")
    .call(yAxis);    

  var cell = svg.append("g")
    .attr("class", "cells")
    .attr("transform", "translate(" + (offset + 25) + "," + (offset + 30) + ")")
    .selectAll("rect");

  var label = svg.append("text")
    .attr("class", "label");

  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
      var week = (d % 52) + 1;
      var year = Math.floor(d / 52);
      return "Age: " + year + " years, " + week + " weeks";
    })

  var avgtip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
      var week = (d % 52) + 1;
      var year = Math.floor(d / 52);
      var state;
      if (d<= 285) {
        state = "Early Life";
      } else if (d > 285 && d <= 597) {
        state = "Elementary School";
      } else if (d > 597 && d <= 753) {
        state = "Middle School";
      } else if (d > 753 && d <= 961) {
        state = "High School";
      } else if (d > 961 && d <= 1169) {
        state = "College";
      } else if (d > 1169 && d < 3276) {
        state = "Career";
      } else if (d >= 3276) {
        state = "Retirement";
      }
      return "<div>Age: " + year + " years, " + week + " weeks</div><div class='state'>"+ state + "</div>";
    })  

  function update(n1) {

    var tipType = avgtip;
    if (input) {
      tipType = tip;
    }

    var n0 = cell.size();

    cell = cell
      .data(d3.range(n1));

    cell.exit()
      .transition()
      .delay(function(d, i) { return (n0 - i) * updateDelay; })
      .duration(updateDuration)
      .attr("width", 0)
      .remove();

    cell.enter().append("rect")
      .attr("width", 0)
      .attr("height", cellSize)
      .attr("x", function(i) {
        var x0 = 0;
        var x1 = Math.floor(i % 52);
        return groupSpacing * x0 + (cellSpacing + cellSize) * (x1 + x0 * 10);
      })
      .attr("y", function(i) {
        var y0 = 0;
        var y1 = Math.floor(i / 52);
        return groupSpacing * y0 + (cellSpacing + cellSize) * (y1 + y0 * 10);
      })
      .attr('class', defineClass)

      .call(tipType)
      .on("mouseover", function(d) {
        tipType.show(d);
        d3.select(this)
          .classed("highlight", true);
      })
      .on("mouseout", function(d) {
        tipType.hide(d);
        d3.select(this)
          .classed("highlight", false);
      })      

      .transition()
        .delay(function(d, i) { return (i - n0) * updateDelay; })
        .duration(updateDuration)
        .attr("width", cellSize);

    label
      .attr("x", "47%")//offset + groupSpacing)
      .attr("y", cellSize)
      .attr("dy", ".71em")
      .transition()
      .duration(Math.abs(n1 - n0) * updateDelay + updateDuration / 2)
      .ease("linear")
      .tween("text", function() {
        var i = d3.interpolateNumber(n0, age);
        var a = d3.interpolateNumber(n0, (Math.floor(age/52)));
        return function(t) {
          if (input) {
            this.textContent = formatNumber(Math.round(a(t))) + " years old";
          } else {
            this.textContent = "Average American Life";
          }
        };
      });
  }

  function exit() {
    var n0 = cell.size();
    counter = n0;
    cell = cell.data(d3.range(0));
    cell.exit()
      .transition()
      .delay(function(d, i) { return (n0 - i) * updateDelay; })
      .duration(updateDuration)
      .attr("width", 0)
      .each("end", onRemove)
      .remove();

    label
      .transition()
      .duration(Math.abs(0 - n0) * updateDelay + updateDuration / 2)
      .ease("linear")
      .tween("text", function() {
        var i = d3.interpolateNumber(age, 0);
        var a = d3.interpolateNumber(Math.floor(age/52), 0);
        return function(t) {
          if (this.textContent.toLowerCase().indexOf('life') > -1) {
            this.textContent = "Average American Life";
          } else {
            this.textContent = formatNumber(Math.round(a(t))) + " years old";
          }
        };
      });
  }

  function onRemove() {
    counter--;
    if(counter == 0) {
      setTimeout(function(){
        update(4680);
      }, 500);
    }
  }

  function calcAge(dateString) {
    var birthday = new Date(dateString);
    var ageDifMs = Date.now() - birthday.getTime();
    var ageDate = new Date(ageDifMs); // miliseconds from epoch
    var weeks = Math.floor(ageDate/604800000);
    var correctedWeeks = weeks - (weeks/364); // correction for .14 extra week every year
    return Math.floor(correctedWeeks);
  }

  function defineClass(i) {
    var className;
    if (input) {
        if (i < age) {
          className = 'active';
        }
    } else {
        if (i <= 285) {
          className = 'early';
        }
        else if (i > 285 && i <= 597) {
          className = 'elem';
        }
        else if (i > 597 && i <= 753) {
          className = 'middle';
        }
        else if (i > 753 && i <= 961) {
          className = 'high';
        }
        else if (i > 961 && i <= 1169) {
          className = 'college';
        }
        else if (i > 1169 && i < 3276) {
          className = 'career';
        }
        else if (i >= 3276) {
          className = 'retire';
        }
    } // end else
    return className;
  } 
    update(4680);
}); 