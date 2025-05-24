const typeColor = {
    "Normal": "#A8A878",
    "Fire": "#F08030",
    "Water": "#6890F0",
    "Electric": "#F8D030",
    "Grass": "#78C850",
    "Ice": "#98D8D8",
    "Fighting": "#C03028",
    "Poison": "#A040A0",
    "Ground": "#E0C068",
    "Flying": "#A890F0",
    "Psychic": "#F85888",
    "Bug": "#A8B820",
    "Rock": "#B8A038",
    "Ghost": "#705898",
    "Dragon": "#7038F8",
    "Dark": "#705848",
    "Steel": "#B8B8D0",
    "Fairy": "#EE99AC"
};

// Store the data globally help search function
let pokemonData = [];
let filteredData = [];

d3.csv("Pokemon_alopez247.csv").then(function (data) {
    // Process data and store it globally for search access
    pokemonData = data;
    filteredData = [...data];
    
    data.forEach(d => {
        d.Total = +d.Total;
        d.HP = +d.HP;
        d.Attack = +d.Attack;
        d.Defense = +d.Defense;
        d.Sp_Atk = +d.Sp_Atk;
        d.Sp_Def = +d.Sp_Def;
        d.Speed = +d.Speed;
        d.Generation = +d.Generation;
        d.Height_m = +d.Height_m;
        d.Weight_kg = +d.Weight_kg;
        d.Catch_Rate = +d.Catch_Rate;
        d.isLegendary = d.isLegendary === "True";
        d.hasMegaEvolution = d.hasMegaEvolution === "True";

        d.Types = [d.Type_1];
        if (d.Type_2) d.Types.push(d.Type_2);
    });
    
 
    initTypeChart();
    initScatterPlot();
    initParallelPlot();
    
    
    // attach search event listeners
    document.getElementById("search-btn").addEventListener("click", searchPokemon);
    document.getElementById("reset-btn").addEventListener("click", resetHighlights);
    document.getElementById("pokemon-search").addEventListener("keypress", function(e) {
        if (e.key === "Enter") searchPokemon();
    });

}).catch(error => {
    console.error("Error loading data:", error);
    document.querySelector(".header").innerHTML += 
        "<p style='color:red'>Error loading data. Please check console for details.</p>";
});

// int type gap
function initTypeChart() {
    const typeWidth = document.querySelector('#type-chart').clientWidth;
    const typeHeight = 300;

    const svgType = d3.select("#type-chart")
        .append("svg")
        .attr("width", typeWidth)
        .attr("height", typeHeight);

    // cal type cont
    const typeCounts = {};
    const allTypes = new Set();

    pokemonData.forEach(d => {
        d.Types.forEach(type => {
            allTypes.add(type);
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
    });
    
    const typeData = Array.from(allTypes).map(type => ({
        type,
        count: typeCounts[type], 
        color: typeColor[type] || "#777"
    })).sort((a, b) => b.count - a.count);

    // type filter set
    const typeFilter = d3.select("#type-filter");
    const typeFilterContainer = d3.select(".type-filter-container");
    const toggleBtn = d3.select(".toggle-type-filter");


    let isFilterExpanded = false;

    // toggle filter visibility
    toggleBtn.on("click", function() {
        isFilterExpanded = !isFilterExpanded;
        typeFilterContainer.classed("expanded", isFilterExpanded);
        toggleBtn.text(isFilterExpanded ? "▲ Hide Filters" : "▼ Click Choose Types");
    });

    // Create Type Button
    typeData.forEach(type => {
        typeFilter.append("button")
            .attr("class", "type-btn")
            .style("background-color", type.color)
            .text(type.type)
            .on("click", function() {
                const btn = d3.select(this);
                btn.classed("active", !btn.classed("active"));
                updateVisualizations();
            });
    });

    // Create a scale bar
    const xScale = d3.scaleBand()
        .domain(typeData.map(d => d.type))
        .range([50, typeWidth - 20])
        .padding(0.2);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(typeData, d => d.count)])
        .range([typeHeight - 40, 20]);
    
    // draw bar gap
    svgType.selectAll("rect")
        .data(typeData)
        .enter().append("rect")
        .attr("x", d => xScale(d.type))
        .attr("y", d => yScale(d.count))
        .attr("width", xScale.bandwidth())
        .attr("height", d => typeHeight - 40 - yScale(d.count))
        .attr("fill", d => d.color)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .on("mouseover", function(event, d) {
            d3.select(this).attr("stroke-width", 2);
            showTooltip(event, `<strong>${d.type}</strong><br/>${d.count} Pokemon`);
        })
        .on("mouseout", function() {
            d3.select(this).attr("stroke-width", 1);
            hideTooltip();
        });
    
    // x-axis
    svgType.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${typeHeight-40})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .attr("text-anchor", "end")
        .attr("dx", "-0.8em")
        .attr("dy", "0.15em");
    
    // y-axis
    svgType.append("g")
        .attr("transform", "translate(50,0)")
        .call(d3.axisLeft(yScale));
}
    //Scatter plot
function initScatterPlot() {
    const scatterWidth = document.querySelector('#scatter').clientWidth;
    const scatterHeight = 300;
    const margin = { top: 40, right: 50, bottom: 40, left: 50 };
    
    const svgScatter = d3.select("#scatter")
        .append("svg")
        .attr("width", scatterWidth)
        .attr("height", scatterHeight);
    
    // Create a clip path to prevent points from showing outside the plot area
    svgScatter.append("defs").append("clipPath")
        .attr("id", "scatter-clip")
        .append("rect")
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("width", scatterWidth - margin.left - margin.right)
        .attr("height", scatterHeight - margin.top - margin.bottom);
    
    // Create scales zoom Point location
    const xScatter = d3.scaleLinear()
        .domain([0, d3.max(pokemonData, d => d.Attack) * 1.1])
        .range([margin.left, scatterWidth - margin.right]);
    
    const yScatter = d3.scaleLinear()
        .domain([0, d3.max(pokemonData, d => d.Defense) * 1.1])
        .range([scatterHeight - margin.bottom, margin.top]);
    
    // Create axis generators
    const xAxis = d3.axisBottom(xScatter);
    const yAxis = d3.axisLeft(yScatter);
    
    // X axes
    const xAxisGroup = svgScatter.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${scatterHeight - margin.bottom})`)
        .call(xAxis);



     //Y axes
    const yAxisGroup = svgScatter.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(yAxis);
    


    //  axis labels
    svgScatter.append("text")
        .attr("class", "axis-label")
        .attr("x", scatterWidth / 2)
        .attr("y", scatterHeight - 5)
        .attr("text-anchor", "middle")
        .text("Attack");
    
    svgScatter.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -scatterHeight / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .text("Defense");
    
    // container for scatter points with clipping
    const pointsGroup = svgScatter.append("g")
        .attr("id", "scatter-points")
        .attr("clip-path", "url(#scatter-clip)");
    
            //legend
        const scatterLegendTypes = Object.keys(typeColor);
        const scatterLegend = svgScatter.append("g")
            .attr("transform", `translate(${scatterWidth - 160}, 10)`);

        //Calculate the number of items that should be displayed in each column (split into 2 columns)
        const itemsPerColumn2 = Math.ceil(scatterLegendTypes.length / 2); 

       
        scatterLegend.selectAll("rect")
            .data(scatterLegendTypes)
            .enter().append("rect")
            .attr("x", (d, i) => i < itemsPerColumn2 ? 0 : 80) // frist column /second colum right or left
            .attr("y", (d, i) => (i % itemsPerColumn2) * 12)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", d => typeColor[d]);

        
        scatterLegend.selectAll("text")
            .data(scatterLegendTypes)
            .enter().append("text")
            .attr("x", (d, i) => i < itemsPerColumn2 ? 20 : 100) 
            .attr("y", (d, i) => (i % itemsPerColumn2) * 12 + 12)
            .text(d => d)
            .style("font-size", "12px")
            .style("fill", "black");



    // Define zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.5, 10]) // Allow zooming from 0.5x to 10x
        .translateExtent([
            [margin.left, margin.top],
            [scatterWidth - margin.right, scatterHeight - margin.bottom]
        ])
        .on("zoom", function(event) {
            const { transform } = event;
            
            // a new scales based on zoom transform
            const newXScale = transform.rescaleX(xScatter);
            const newYScale = transform.rescaleY(yScatter);
            
            // update axes
            xAxisGroup.call(xAxis.scale(newXScale));
            yAxisGroup.call(yAxis.scale(newYScale));
            
            // update scatter points
            pointsGroup.selectAll("circle")
                .attr("cx", d => newXScale(d.Attack))
                .attr("cy", d => newYScale(d.Defense));
        });
    
    // zoom behavior to SVG
    svgScatter.call(zoom);
    
    // Store scales and zoom for external access
    svgScatter.xScale = xScatter;
    svgScatter.yScale = yScatter;
    svgScatter.zoom = zoom;
    
    // update
    updateScatterPlot(pokemonData);
}

// Updated updateScatterPlot function to work with zoom
function updateScatterPlot(data) {
    const svgScatter = d3.select("#scatter svg");
    const pointsGroup = svgScatter.select("#scatter-points");
    
    // Get current scales (might be transformed by zoom)
    const currentTransform = d3.zoomTransform(svgScatter.node());
    const xScale = currentTransform.rescaleX(svgScatter.xScale);
    const yScale = currentTransform.rescaleY(svgScatter.yScale);
    
    // Update scatter points
    const circles = pointsGroup.selectAll("circle")
        .data(data);
    
    circles.enter()
        .append("circle")
        .merge(circles)
        .attr("cx", d => xScale(d.Attack))
        .attr("cy", d => yScale(d.Defense))
        .attr("r", 4)
        .attr("fill", d => getTypeColor(d['Type 1']))
        .attr("opacity", 0.7)
        .attr("stroke", "white")
        .attr("stroke-width", 0.5)
        .on("mouseover", function(event, d) {
            showTooltip(event, `
                <strong>${d.Name}</strong><br/>
                Type: ${d['Type 1']}${d['Type 2'] ? '/' + d['Type 2'] : ''}<br/>
                Attack: ${d.Attack}<br/>
                Defense: ${d.Defense}
            `);
        })
        .on("mouseout", hideTooltip);
    
    circles.exit().remove();
}




// int Parallel Coordinates Plot
function initParallelPlot() {
    const parallelWidth = document.querySelector('#parallel').clientWidth;
    const parallelHeight = Math.min(600, window.innerHeight * 0.5);
    
    const svgParallel = d3.select("#parallel")
        .append("svg")
        .attr("width", parallelWidth)
        .attr("height", parallelHeight);
    
    const dimensions = ["HP", "Attack", "Defense", "Sp_Atk", "Sp_Def", "Speed"];
    const xScaleParallel = d3.scalePoint()
        .domain(dimensions)
        .range([50, parallelWidth - 50]);



    // Create scales for each dimension and bind to the DOM
    dimensions.forEach(dim => {
        const scale = d3.scaleLinear()
            .domain(d3.extent(pokemonData, d => d[dim]))
            .range([parallelHeight - 20, 30]);
        
        
        const axisGroup = svgParallel.append("g")
            .attr("class", `${dim}-axis`)
            .attr("transform", `translate(${xScaleParallel(dim)}, 0)`)
            .call(d3.axisLeft(scale));
            
        axisGroup.append("text")
            .attr("y", 20)
            .attr("x", -25)
            .text(dim)
            .attr("fill", '#666')
            .attr("font-size", "12px");
            
        // save DATA IN DOM
        axisGroup.node().__scale__ = scale;
    });
    
    
    const line = d3.line()
        .defined(d => !isNaN(d.value))
        .x(d => xScaleParallel(d.name))
        .y(d => {
            
            const scale = svgParallel.select(`.${d.name}-axis`).node().__scale__;
            return scale(d.value);
        });



           
    // parallel coordinate lines
    svgParallel.append("g")
        .attr("id", "parallel-lines")
        .selectAll("path")
        .data(pokemonData)
        .enter().append("path")
        .attr("d", d => line(dimensions.map(dim => ({name: dim, value: d[dim]}))))
        .attr("stroke", d => typeColor[d.Type_1] || "#777")
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.1)
        .attr("fill", "none")
        .on("mouseover", parallelMouseover)
        .on("mouseout", parallelMouseout);
    
    // legend
    const parallelLegend = svgParallel.append("g")
        .attr("transform", `translate(${parallelWidth - 170}, 10)`);
        
    const legendTypes = Object.keys(typeColor);
    const itemsPerColumn = Math.ceil(legendTypes.length / 2); 
    parallelLegend.selectAll("rect")
        .data(legendTypes)
        .enter().append("rect")
        .attr("x", (d, i) => i < itemsPerColumn ? -80 : -10)
        .attr("y", (d, i) => (i % itemsPerColumn-1) * 13)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", d => typeColor[d]);

    parallelLegend.selectAll("text")
        .data(legendTypes)
        .enter().append("text")
        .attr("x", (d, i) => i < itemsPerColumn ? -60 : 10)
        .attr("y", (d, i) => (i % itemsPerColumn-1) * 13 + 12)
        .text(d => d)
        .style("font-size", "12px");
}

// update Visualizations
function updateVisualizations() {
    const activeTypes = [];
    d3.selectAll(".type-btn.active").each(function() {
        activeTypes.push(d3.select(this).text());
    });
    
    if (activeTypes.length > 0) {
        filteredData = pokemonData.filter(d => 
            activeTypes.includes(d.Type_1) || 
            (d.Type_2 && activeTypes.includes(d.Type_2))
        );
    } else {
        filteredData = [...pokemonData];
    }
    

    updateTypeBars(activeTypes);
    
    

    updateScatterPlot(filteredData);
    updateParallelPlot(filteredData);
}

// ani bar gap
function updateTypeBars(activeTypes) {
    const typeWidth = document.querySelector('#type-chart').clientWidth;
    const typeHeight = 300;
    
    // cal count
    const typeCounts = {};
    const allTypes = new Set();
    
    filteredData.forEach(d => {
        d.Types.forEach(type => {
            allTypes.add(type);
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
    });
    
    const updatedTypeData = Array.from(allTypes).map(type => ({
        type,
        count: typeCounts[type], 
        color: typeColor[type] || "#777",
        active: activeTypes.includes(type)
    })).sort((a, b) => b.count - a.count);
    
    // Update scale
    const xScale = d3.scaleBand()
        .domain(updatedTypeData.map(d => d.type))
        .range([50, typeWidth - 20])
        .padding(0.2);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(updatedTypeData, d => d.count)])
        .range([typeHeight - 40, 20]);
    
    // update bar gap
    const svgType = d3.select("#type-chart svg");
    const bars = svgType.selectAll("rect")
        .data(updatedTypeData, d => d.type);


    
    // remove 
    bars.exit()
        .transition()
        .duration(800)
        .attr("height", 0)
        .attr("y", typeHeight - 40)
        .remove();
    
    // update bar
    bars.transition()
        .duration(800)
        .attr("x", d => xScale(d.type))
        .attr("y", d => yScale(d.count))
        .attr("width", xScale.bandwidth())
        .attr("height", d => typeHeight - 40 - yScale(d.count))
        .attr("fill", d => d.active ? d3.color(d.color).brighter(0.5) : d.color)
        .attr("stroke-width", d => d.active ? 3 : 1);


    
    // add bar
    bars.enter()
        .append("rect")
        .attr("x", d => xScale(d.type))
        .attr("y", typeHeight - 40)
        .attr("width", xScale.bandwidth())
        .attr("height", 0)
        .attr("fill", d => d.color)
        .attr("stroke", "#fff")
        .attr("stroke-width", d => d.active ? 3 : 1)
        .on("mouseover", function(event, d) {
            d3.select(this).attr("stroke-width", 2);
            showTooltip(event, `<strong>${d.type}</strong><br/>${d.count} Pokemon`);
        })
        .on("mouseout", function() {
            const d = d3.select(this).datum();
            d3.select(this).attr("stroke-width", d.active ? 3 : 1);
            hideTooltip();
        })
        .transition()
        .duration(800)
        .attr("y", d => yScale(d.count))
        .attr("height", d => typeHeight - 40 - yScale(d.count));
    
    // x
    svgType.select(".x-axis")
        .transition()
        .duration(800)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .attr("text-anchor", "end")
        .attr("dx", "-0.8em")
        .attr("dy", "0.15em");
}

// Scatter plot
function updateScatterPlot(plotData) {
    const scatterWidth = document.querySelector('#scatter').clientWidth;
    const scatterHeight = 300;
    const margin = { top: 40, right: 50, bottom: 40, left: 50 };



    //Point location
    const xScatter = d3.scaleLinear()
        .domain([0, d3.max(plotData, d => d.Attack) * 1.1])
        .range([margin.left, scatterWidth - margin.right]);
    
    const yScatter = d3.scaleLinear()
        .domain([0, d3.max(plotData, d => d.Defense) * 1.1])
        .range([scatterHeight - margin.bottom, margin.top]);
    
    const svgScatter = d3.select("#scatter svg");
    const circles = svgScatter.select("#scatter-points")
        .selectAll("circle")
        .data(plotData, d => d.Name);

    
    //animation of Scatter plot
    circles.exit()
        .transition()
        .duration(300)
        .attr("r", 0)
        .remove();
    
    circles.transition()
        .duration(800)
        .attr("cx", d => xScatter(d.Attack))
        .attr("cy", d => yScatter(d.Defense))
        .attr("opacity", 0.7)
        .attr("r", 4);
    
    circles.enter().append("circle")
        .attr("cx", d => xScatter(d.Attack))
        .attr("cy", d => yScatter(d.Defense))
        .attr("r", 0)
        .attr("fill", d => typeColor[d.Type_1] || "#777")
        .attr("opacity", 0)
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .on("mouseover", scatterMouseover)
        .on("mouseout", scatterMouseout)
        .transition()
        .duration(500)
        .attr("r", 4)
        .attr("opacity", 0.7);
}



// Parallel Coordinates Plot
function updateParallelPlot(plotData) {
    const parallelWidth = document.querySelector('#parallel').clientWidth;
    const parallelHeight = Math.min(600, window.innerHeight * 0.5);
    
    const svgParallel = d3.select("#parallel svg");
    const dimensions = ["HP", "Attack", "Defense", "Sp_Atk", "Sp_Def", "Speed"];
    const xScaleParallel = d3.scalePoint()
        .domain(dimensions)
        .range([50, parallelWidth - 50]);
    
    // Update the scale of each dimension
    dimensions.forEach(dim => {
        const scale = d3.scaleLinear()
            .domain(d3.extent(plotData, d => d[dim]))
            .range([parallelHeight - 20, 30]);
        
        // Update scale
        svgParallel.select(`.${dim}-axis`).node().__scale__ = scale;
        
        // Update Axis
        svgParallel.select(`.${dim}-axis`)
            .transition()
            .duration(500)
            .call(d3.axisLeft(scale));
    });
    
    // Update line generator
    const line = d3.line()
        .defined(d => !isNaN(d.value))
        .x(d => xScaleParallel(d.name))
        .y(d => {
            const scale = svgParallel.select(`.${d.name}-axis`).node().__scale__;
            return scale(d.value);
        });
    
    // renew the line
    const lines = svgParallel.select("#parallel-lines")
        .selectAll("path")
        .data(plotData, d => d.Name);
    
    // Animation 
    // remove not choose type line
    lines.exit()
        .transition()
        .duration(300)
        .attr("opacity", 0)
        .remove();
    
    // choose type line
    lines.transition()
        .duration(500)
        .attr("d", d => line(dimensions.map(dim => ({name: dim, value: d[dim]}))))
        .attr("stroke", d => typeColor[d.Type_1] || "#777")
        .attr("opacity", 0.3 || 0.1)
        .attr("stroke-width", 1.5);
    
    // add new lines
    lines.enter().append("path")
        .attr("d", d => line(dimensions.map(dim => ({name: dim, value: d[dim]}))))
        .attr("stroke", d => typeColor[d.Type_1] || "#777")
        .attr("stroke-width", 1.5)
        .attr("opacity", 0)
        .attr("fill", "none")
        .on("mouseover", parallelMouseover)
        .on("mouseout", parallelMouseout)
        .transition()
        .duration(500)
        .attr("opacity", 0.1);
}

// mos move on points show the information
function scatterMouseover(event, d) {
    d3.select(this).attr("r", 6).attr("opacity", 1);
    showTooltip(event, `
        <strong>${d.Name}</strong><br/>
        Type: ${d.Type_1}${d.Type_2 ? "/" + d.Type_2 : ""}<br/>
        Attack: ${d.Attack}<br/>
        Defense: ${d.Defense}<br/>
        Total: ${d.Total}
    `);
}

function scatterMouseout() {
    d3.select(this).attr("r", 4).attr("opacity", 0.1);
    hideTooltip();
}

function parallelMouseover(event, d) {
    d3.select(this).attr("opacity", 1).attr("stroke-width", 3);
    showTooltip(event, `
        <strong>${d.Name}</strong><br/>
        Type: ${d.Type_1}${d.Type_2 ? "/" + d.Type_2 : ""}<br/>
        HP: ${d.HP}<br/>
        Attack: ${d.Attack}<br/>
        Defense: ${d.Defense}<br/>
        Sp_Atk: ${d.Sp_Atk}<br/>
        Sp_Def: ${d.Sp_Def}<br/>
        Speed: ${d.Speed}<br/>
        Total: ${d.Total}
    `);
}
//MOS move away 
function parallelMouseout() {
    d3.select(this).attr("opacity", 0.1).attr("stroke-width", 1.5);
    hideTooltip();
}

function showTooltip(event, html) {
    d3.select("#tooltip")
        .style("opacity", 1)
        .html(html)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
}

function hideTooltip() {
    d3.select("#tooltip").style("opacity", 0);
}

// search Pokemon
function searchPokemon() {
    const searchTerm = document.getElementById("pokemon-search").value.trim().toLowerCase();
    if (!searchTerm) {
        resetHighlights();
        return;
    }

    const matchedPokemon = pokemonData.filter(d => 
        d.Name.toLowerCase().includes(searchTerm) ||
        (d.Type_1 && d.Type_1.toLowerCase().includes(searchTerm)) || 
        (d.Type_2 && d.Type_2.toLowerCase().includes(searchTerm))
    );

    if (matchedPokemon.length === 0) {
        d3.select("#search-info h4")
            .style("color", "red")
            .text("No Pokémon found matching your search");
        return;
    }

    highlightPokemon(matchedPokemon);
}
//highlight Pokemon
function highlightPokemon(matchedPokemon) {
    if (matchedPokemon.length === 0) return;

    const matchedNames = matchedPokemon.map(p => p.Name);
    
    //  Parallel Coordinates Plots
    d3.select("#parallel-lines").selectAll("path")
        .attr("opacity", d => matchedNames.includes(d.Name) ? 1 : 0.1)
        .attr("stroke-width", d => matchedNames.includes(d.Name) ? 3 : 1);
    
    // scatter plot
    d3.select("#scatter-points").selectAll("circle")
        .attr("opacity", d => matchedNames.includes(d.Name) ? 1 : 0.1)
        .attr("r", d => matchedNames.includes(d.Name) ? 6 : 4);
}

function resetHighlights() {
    // reset parallel coordinates plot
    d3.select("#parallel-lines").selectAll("path")
        .attr("opacity", 0.1)
        .attr("stroke-width", 1.5);
    
    // reset scatter plot
    d3.select("#scatter-points").selectAll("circle")
        .attr("opacity", 0.7)
        .attr("r", 4);
    
    // Clear Search
    d3.select("#search-info h4")
        .style("color", "")
        .text("Enter the name or type of Pokémon to search, and that Pokémon will be highlighted");
}