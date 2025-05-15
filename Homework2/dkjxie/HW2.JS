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
    "Flying":"#A890F0",
    "Psychic": "#F85888",
    "Bug": "#A8B820",
    "Rock":"#B8A038",
    "Ghost": "#705898",
    "Dragon": "#7038F8",
    "Dark": "#705848",
    "Steel": "#B8B8D0",
    "Fairy": "#EE99AC"
};

// Store the data globally help search function
let pokemonData = [];

d3.csv("Pokemon_alopez247.csv").then(function (data) {
    // Process data and store it globally for search access
    pokemonData = data;
    
    data.forEach(d => {
        d.Total = +d.Total;
        d.HP = +d.HP;
        d.Attack= +d.Attack;
        d.Defense = +d.Defense;
        d.Sp_Atk = +d.Sp_Atk;
        d.Sp_Def = +d.Sp_Def;
        d.Speed= +d.Speed;
        d.Generation = +d.Generation;
        d.Height_m = +d.Height_m;
        d.Weight_kg = +d.Weight_kg;
        d.Catch_Rate = +d.Catch_Rate;
        d.isLegendary= d.isLegendary === "True";
        d.hasMegaEvolution = d.hasMegaEvolution === "True";

        d.Types = [d.Type_1];
        if (d.Type_2) d.Types.push(d.Type_2);
    });
    
    const typeWidth = document.querySelector('#type-chart').clientWidth;
    const typeHeight = 300;

    

    const svgType = d3.select("#type-chart")
        .append("svg")
        .attr("width", typeWidth)
        .attr("height",typeHeight);

    const typeCounts = {};
    const allTypes = new Set();

    data.forEach(d => {
        d.Types.forEach(type => {
            allTypes.add(type);
            typeCounts[type] =(typeCounts[type] || 0) + 1;
        });
    });
    
    const typeData = Array.from(allTypes).map(type => ({
        type,
        count: typeCounts[type], 
        color: typeColor[type] || "#777"
    })).sort((a, b)=> b.count- a.count);

    const typeFilter = d3.select("#type-filter");
    typeData.forEach(type => {
        typeFilter.append("button")
            .attr("class", "type-btn")
            .style("background-color", type.color)
            .text(type.type)
            .on("click", function () {
                const btn = d3.select(this);
                btn.classed("active", !btn.classed("active"));
                updateVisualizations();
            });
    });

    typeFilter.append("button")
        .attr("class", "type-btn active")
        .style("background-color", "#666")
        .text("All")
        .on("click", function () {
            d3.selectAll(".type-btn").classed("active", false);
            d3.select(this).classed("active", true);
            updateVisualizations();
        });

    //draw type bars
    const xScale = d3.scaleBand()
        .domain(typeData.map(d => d.type))
        .range([50, typeWidth - 20])
        .padding(0.2);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(typeData, d => d.count)])
        .range([typeHeight - 40, 20]);
    
    svgType.append("g")
        .selectAll("rect")
        .data(typeData)
        .enter().append("rect")
        .attr("x", d => xScale(d.type))
        .attr("y", d => yScale(d.count))
        .attr("width", xScale.bandwidth())
        .attr("height", d => typeHeight - 40 - yScale(d.count))
        .attr("fill", b => b.color)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)


        //mouseover box showing
        .on("mouseover", function (event, d) {
            d3.select(this).attr("stroke-width", 2);
            d3.select("#tooltip")
                .style("opacity", 1)
                .html(`<strong>${d.type}</strong><br/>${d.count} Pokemon`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function () {
            d3.select(this).attr("stroke-width", 1);
            d3.select("#tooltip").style("opacity", 0);
        });
    
    svgType.append("g")
        .attr("transform", `translate(0,${typeHeight-40})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .attr("text-anchor", "end")
        .attr("dx", "-0.8em")
        .attr("dy", "0.15em");
    
    svgType.append("g")
        .attr("transform", "translate(50,0)")
        .call(d3.axisLeft(yScale));
    
    const scatterWidth = document.querySelector('#scatter').clientWidth;
    const scatterHeight = 400;
    const margin = { top: 40, right: 50, bottom: 40, left: 50 };
    
    
    const svgScatter = d3.select("#scatter")
        .append("svg")
        .attr("width", scatterWidth)
        .attr("height", scatterHeight);
    
    const xScatter = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Attack) * 1.1])
        .range([margin.left, scatterWidth - margin.right]);
    
    const yScatter = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Defense) * 1.1])
        .range([scatterHeight - margin.bottom, margin.top]);  
    
    svgScatter.append("g")
        .attr("transform", `translate(0, ${scatterHeight - margin.bottom})`)
        .call(d3.axisBottom(xScatter));
    
    svgScatter.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScatter));

    svgScatter.append("text")
        .attr("x", scatterWidth / 2)
        .attr("y", scatterHeight - 20)
        .attr("text-anchor", "middle")
        .text("Attack");
    
    svgScatter.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -scatterHeight / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .text("Defense");
        
            
    // Draw points with an ID
     svgScatter.append("g")
        .attr("id", "scatter-points") // Add an ID to the group for easier selection
        .selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => xScatter(d.Attack))
        .attr("cy", d => yScatter(d.Defense))
        .attr("r", 4)
        .attr("fill", d => typeColor[d.Type_1] || "#777")
        .attr("opacity", 0.7)
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)


        .on("mouseover", function(event, d) {
            d3.select(this).attr("r", 6).attr("opacity", 1);
            d3.select("#tooltip")
                .style("opacity", 1)
                .html(`<strong>${d.Name}</strong><br/>

                    Type: ${d.Type_1}${d.Type_2 ? "/" + d.Type_2 : ""}<br/>
                    Attack: ${d.Attack}<br/>
                    Defense: ${d.Defense}<br/>
                    Total: ${d.Total}`)


                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("r", 4).attr("opacity", 0.7);
            d3.select("#tooltip").style("opacity", 0);
        });
       const scatterLegendTypes = Object.keys(typeColor);
        const scatterLegend = svgScatter.append("g")
            .attr("transform", `translate(${scatterWidth - 150}, 40)`);

        //Calculate the number of items that should be displayed in each column (split into 2 columns)
        const itemsPerColumn2 = Math.ceil(scatterLegendTypes.length / 2); 

       
        scatterLegend.selectAll("rect")
            .data(scatterLegendTypes)
            .enter().append("rect")
            .attr("x", (d, i) => i < itemsPerColumn2 ? 0 : 80) // frist column /second colum right or left
            .attr("y", (d, i) => (i % itemsPerColumn2) * 20)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", d => typeColor[d]);

        
        scatterLegend.selectAll("text")
            .data(scatterLegendTypes)
            .enter().append("text")
            .attr("x", (d, i) => i < itemsPerColumn2 ? 20 : 100) 
            .attr("y", (d, i) => (i % itemsPerColumn2) * 20 + 12)
            .text(d => d)
            .style("font-size", "12px")
            .style("fill", "black");


        
        
            
    // Parallel Coordinates Plot 
    const parallelWidth = document.querySelector('#parallel').clientWidth;
    const parallelHeight = Math.min(600, window.innerHeight * 0.6);;
    
    const svgParallel = d3.select("#parallel")
        .append("svg")
        .attr("width", parallelWidth)
        .attr("height", parallelHeight);
    
    const dimensions = ["HP", "Attack", "Defense", "Sp_Atk", "Sp_Def", "Speed"];
    
    // Scales for each dimension
    const yScales = {};
    dimensions.forEach(dim => {
        yScales[dim] = d3.scaleLinear()
            .domain(d3.extent(data, d => d[dim]))
            .range([parallelHeight - 30, 30]);
    });
    
    // X scale for dimensions
    const xScaleParallel = d3.scalePoint()
        .domain(dimensions)
        .range([50, parallelWidth - 50]);
    
    // draw axes
    dimensions.forEach(dim => {
        svgParallel.append("g")
            .attr("transform", `translate(${xScaleParallel(dim)}, 0)`)
            .call(d3.axisLeft(yScales[dim]).ticks(5))
            .append("text")
            .attr("y", 20)
            .attr("x", -25)
            .text(dim)
            .attr("fill", '#666')
            .attr("font-size", "12px");
    });
    
    // draw lines
    const line = d3.line()
        .defined(d => !isNaN(d.value))
        .x(d => xScaleParallel(d.name))
        .y(d => yScales[d.name](d.value));
           
    
         svgParallel.append("g")
        .attr("id", "parallel-lines")
        .selectAll("path")
        .data(data)
        .enter().append("path")
        .attr("d", d => line(dimensions.map(dim => ({name: dim, value: d[dim]}))))
        .attr("stroke", d => typeColor[d.Type_1] || "#777")
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.1)
        .attr("fill", "none")
        .on("mouseover", function(event, d) {         
            d3.select(this).attr("opacity", 1).attr("stroke-width", 3);
            d3.select("#tooltip")
                .style("opacity", 1)
                .html(`<strong>${d.Name}</strong><br/>
                    Type: ${d.Type_1}${d.Type_2 ? "/" + d.Type_2 : ""}<br/>
                    HP: ${d.HP}<br/>
                    Attack: ${d.Attack}<br/>
                    Defense: ${d.Defense}<br/>
                    Sp_Atk: ${d.Sp_Atk}<br/>
                    Sp_Def: ${d.Sp_Def}<br/>
                    Speed: ${d.Speed}<br/>
                    Total: ${d.Total}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("opacity", 0.1).attr("stroke-width", 1);
            d3.select("#tooltip").style("opacity", 0);
        });
    
    // Legend
    const parallelLegend = svgParallel.append("g")
    .attr("transform", `translate(${parallelWidth - 150}, 40)`);
        
        const legendTypes = Object.keys(typeColor);
        const itemsPerColumn = Math.ceil(legendTypes.length / 2); 
        parallelLegend.selectAll("rect")
        .data(legendTypes)
        .enter().append("rect")
        .attr("x", (d, i) => i < itemsPerColumn ? -80 : -10) // frist column /second colum
        .attr("y", (d, i) => (i % itemsPerColumn-1) * 20)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", d => typeColor[d]);

    parallelLegend.selectAll("text")
        .data(legendTypes)
        .enter().append("text")
        .attr("x", (d, i) => i < itemsPerColumn ? -60 : 10)
        .attr("y", (d, i) => (i % itemsPerColumn-1) * 20 + 12)
        .text(d => d)
        .style("font-size", "12px");
    
    // attach search event listeners
    document.getElementById("search-btn").addEventListener("click", searchPokemon);
    document.getElementById("pokemon-search").addEventListener("keypress", function(e) {
        if (e.key === "Enter") searchPokemon();
    });
    
    // update function for filtering
    function updateVisualizations() {
        const activeTypes = [];
        d3.selectAll(".type-btn.active").each(function() {
            if (d3.select(this).text() !== "All") {
                activeTypes.push(d3.select(this).text());
            }
        });
        
        let filteredData = data;
        if (activeTypes.length > 0) {
            filteredData = data.filter(d => 
                activeTypes.includes(d.Type_1) || 
                (d.Type_2 && activeTypes.includes(d.Type_2))
            );
        }
        
        // update scatter plot
        svgScatter.selectAll("#scatter-points").remove();
        svgScatter.append("g")
            .attr("id", "scatter-points")
            .selectAll("circle")
            .data(filteredData)
            .enter().append("circle")
            .attr("cx", d => xScatter(d.Attack))
            .attr("cy", d => yScatter(d.Defense))
            .attr("r", 4)
            .attr("fill", d => typeColor[d.Type_1] || "#777")
            .attr("opacity", 0.7)
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.5)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("r", 6).attr("opacity", 1);
                d3.select("#tooltip")
                    .style("opacity", 2)
                    .html(`<strong>${d.Name}</strong><br/>
                        Type: ${d.Type_1}${d.Type_2 ? "/" + d.Type_2 : ""}<br/>
                        Attack: ${d.Attack}<br/>
                        Defense: ${d.Defense}<br/>
                        Total: ${d.Total}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).attr("r", 4).attr("opacity", 0.7);
                d3.select("#tooltip").style("opacity", 0);
            });
        
        // update parallel coordinates
        svgParallel.select("#parallel-lines").remove();
        svgParallel.append("g")
            .attr("id", "parallel-lines")
            .selectAll("path")
            .data(filteredData)
            .enter().append("path")
            .attr("d", d => line(dimensions.map(dim => ({name: dim, value: d[dim]}))))
            .attr("stroke", d => typeColor[d.Type_1] || "#777")
            .attr("stroke-width", 1.5)
            .attr("opacity", 0.6)
            .attr("fill", "none")
            .on("mouseover", function(event, d) {
                d3.select(this).attr("opacity", 1).attr("stroke-width", 3);
                
                // highlight scatter plot
                svgScatter.selectAll("circle")
                    .attr("opacity", node => {
                        return node.__data__.Name === d.Name ? 1 : 0.1;
                    });
                
                d3.select("#tooltip")
                    .style("opacity", 1)
                    .html(`<strong>${d.Name}</strong><br/>
                           Type: ${d.Type_1}${d.Type_2 ? "/" + d.Type_2 : ""}<br/>
                           Generation: ${d.Generation}<br/>
                           Total: ${d.Total}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).attr("opacity", 0.6).attr("stroke-width", 1.5);
                svgScatter.selectAll("circle").attr("opacity", 0.7);
                d3.select("#tooltip").style("opacity", 0);
            });
    }
}).catch(error => {
    console.error("Error loading data:", error);
    document.querySelector(".header").innerHTML += 
        "<p style='color:red'>Error loading data. Please check console for details.</p>";
});

// Search function defined outside but has access to pokemonData via closure
function searchPokemon() {
    const searchTerm = document.getElementById("pokemon-search").value.trim().toLowerCase();
    if (!searchTerm) {
        resetHighlights();
        return;
    }

    const matchedPokemon = pokemonData.filter(d => 
        d.Name.toLowerCase().includes(searchTerm)||
        (d.Type_1 && d.Type_1.toLowerCase().includes(searchTerm)) || 
        (d.Type_2 && d.Type_2.toLowerCase().includes(searchTerm))
    );

    highlightPokemon(matchedPokemon);
}

function highlightPokemon(matchedPokemon) {
    if (matchedPokemon.length === 0) {
        alert("No Pokémon found!");
        return;
    }

    // Get the matched Pokemon names for easy comparison
    const matchedNames = matchedPokemon.map(p => p.Name);
    


    // Highlight in parallel coordinates
    d3.select("#parallel-lines").selectAll("path")
        .attr("opacity", d => matchedNames.includes(d.Name) ? 1 : 0.1)
        .attr("stroke-width", d => matchedNames.includes(d.Name) ? 3 : 1);
       
}

function resetHighlights() {
 
    // Reset parallel coordinates
    d3.select("#parallel-lines").selectAll("path")
        .attr("opacity", 0.1)
        .attr("stroke-width", 1.5);
}

