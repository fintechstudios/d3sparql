!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e(require("d3"),require("topojson-client")):"function"==typeof define&&define.amd?define(["d3","topojson-client"],e):(t=t||self).d3sparql=e(t.d3,t.topojson)}(this,(function(t,e){"use strict";t=t&&Object.prototype.hasOwnProperty.call(t,"default")?t.default:t;const a={version:"d3sparql.js version 2020-04-25",debug:!1};function r(...t){if(a.debug){const e=[];for(const a of t)switch(typeof a){case"object":e.push(JSON.stringify(a));break;default:e.push(a)}console.debug(...e)}}return a.fetch=async(t,e={})=>{r(t);const a=await fetch(t,{...e,headers:{...e.headers,Accept:"application/sparql-results+json"}});if(!a.ok)throw new Error(await a.text());return a.json()},a.query=function(t,e,r="GET"){const n=new URL(t);if("GET"===r)return n.search="query="+encodeURIComponent(e),a.fetch(n.href);if("POST"===r){const t=new FormData;t.append("query",e);const r=new URLSearchParams([...t.entries()]);return a.fetch(n.href,{body:r,method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"}})}throw new TypeError("unsupported query type: "+r)},a.graph=function(t,e={}){let a=t.head.lets||t.head.vars||[],n=t.results.bindings,l=e.key1||a[0]||"key1",i=e.key2||a[1]||"key2",s=e.label1||a[2]||!1,o=e.label2||a[3]||!1,c=e.value1||a[4]||!1,d=e.value2||a[5]||!1,u={nodes:[],links:[]},h=new Map,p=0;for(let t=0;t<n.length;t++){let e=n[t],a=e[l].value,r=e[i].value,f=s?e[s].value:a,g=o?e[o].value:r,m=!!c&&e[c].value,y=!!d&&e[d].value;h.has(a)||(u.nodes.push({key:a,label:f,value:m}),h.set(a,p),p++),h.has(r)||(u.nodes.push({key:r,label:g,value:y}),h.set(r,p),p++),u.links.push({source:h.get(a),target:h.get(r)})}return r(u),u},a.tree=function(e,a={}){let n=e.head.lets||e.head.vars||[],l=e.results.bindings,i=a.root||n[0],s=a.parent||n[1],o=a.child||n[2],c=a.value||n[3]||"value",d=new Map,u=new Map,h=l[0][i].value,p=!0,f=p;for(let t=0;t<l.length;t++){const e=l[t];if(p=e[s].value,f=e[o].value,p!==f){let t;d.has(p)?(t=d.get(p),t.push(f)):t=[f],d.set(p,t),e[c]&&u.set(f,e[c].value)}}let g=function e(a){let r=d.get(a);if(r){let n=r.map(t=>e(t)),l=t.sum(n,t=>t.value);return{name:a,children:n,value:t.sum([l,u.get(a)])}}return{name:a,value:u.get(a)||1}}(h);return r(g),g},a.htmltable=function(t,e={}){let n=t.head.lets||t.head.vars||[],l=t.results.bindings,i=e.columns||n,s=e.headers||i,o=e.selector||null,c=void 0!==e.limit?e.limit:l.length,d=void 0!==e.offset?e.offset:0;l=l.slice(d,d+c);let u=a.select(o,"htmltable").append("table").attr("class","table table-bordered");r("Table"),r(u);let h=u.append("thead"),p=u.append("tbody");h.append("tr").selectAll("th").data(s).enter().append("th").text(t=>t);let f=p.selectAll("tr").data(l).enter().append("tr").selectAll("td").data(t=>i.map(e=>t[e]?t[e].value:"")).enter().append("td").text(t=>t);r("Table cells"),r(f),u.style({margin:"10px"}),u.selectAll("th").style({background:"#eeeeee","text-transform":"capitalize"})},a.htmlhash=function(t,e){e=e||{};let r=t.head.lets||t.head.vars||[],n=t.results.bindings[0],l=e.selector||null,i=a.select(l,"htmlhash").append("table").attr("class","table table-bordered"),s=i.append("tbody").selectAll("tr").data(()=>r.map(t=>({head:t,data:n[t]?n[t].value:""}))).enter().append("tr");s.append("th").text(t=>t.head),s.append("td").text(t=>t.data),i.style({margin:"10px"}),i.selectAll("th").style({background:"#eeeeee","text-transform":"capitalize"})},a.barchart=function(e,r={}){let n=e.head.lets||e.head.vars||[],l=e.results.bindings,i={label_x:r.label_x||n[0],label_y:r.label_y||n[1],let_x:r.let_x||n[0],let_y:r.let_y||n[1],width:r.width||750,height:r.height||300,margin:r.margin||80,selector:r.selector||null},s=t.scale.ordinal().rangeRoundBands([0,i.width-i.margin],.1),o=t.scale.linear().range([i.height-i.margin,0]),c=t.svg.axis().scale(s).orient("bottom"),d=t.svg.axis().scale(o).orient("left");s.domain(l.map((function(t){return t[i.let_x].value}))),o.domain(t.extent(l,(function(t){return parseInt(t[i.let_y].value)})));let u=a.select(i.selector,"barchart").append("svg").attr("width",i.width).attr("height",i.height),h=u.append("g").attr("class","axis x").attr("transform","translate("+i.margin+","+(i.height-i.margin)+")").call(c),p=u.append("g").attr("class","axis y").attr("transform","translate("+i.margin+",0)").call(d),f=u.selectAll(".bar").data(l).enter().append("rect").attr("transform","translate("+i.margin+",0)").attr("class","bar").attr("x",(function(t){return s(t[i.let_x].value)})).attr("width",s.rangeBand()).attr("y",(function(t){return o(t[i.let_y].value)})).attr("height",(function(t){return i.height-o(parseInt(t[i.let_y].value))-i.margin}));h.selectAll("text").attr("dy",".35em").attr("x",10).attr("y",0).attr("transform","rotate(90)").style("text-anchor","start"),h.append("text").attr("class","label").text(i.label_x).style("text-anchor","middle").attr("transform","translate("+(i.width-i.margin)/2+","+(i.margin-5)+")"),p.append("text").attr("class","label").text(i.label_y).style("text-anchor","middle").attr("transform","rotate(-90)").attr("x",0-i.height/2).attr("y",0-(i.margin-20)),f.attr({fill:"steelblue"}),u.selectAll(".axis").attr({stroke:"black",fill:"none","shape-rendering":"crispEdges"}),u.selectAll("text").attr({stroke:"none",fill:"black","font-size":"8pt","font-family":"sans-serif"})},a.piechart=function(e,r={}){let n=e.head.lets||e.head.vars||[],l=e.results.bindings,i={label:r.label||n[0],size:r.size||n[1],width:r.width||700,height:r.height||700,margin:r.margin||10,hole:r.hole||100,selector:r.selector||null},s=Math.min(i.width,i.height)/2-i.margin,o=Math.max(Math.min(s-50,i.hole),0),c=t.scale.category20(),d=t.svg.arc().outerRadius(s).innerRadius(o),u=t.layout.pie().value((function(t){return t[i.size].value})),h=a.select(i.selector,"piechart").append("svg").attr("width",i.width).attr("height",i.height).append("g").attr("transform","translate("+i.width/2+","+i.height/2+")"),p=h.selectAll(".arc").data(u(l)).enter().append("g").attr("class","arc"),f=p.append("path").attr("d",d).attr("fill",(function(t,e){return c(e)}));p.append("text").attr("class","label").attr("transform",(function(t){return"translate("+d.centroid(t)+")"})).attr("dy",".35em").attr("text-anchor","middle").text((function(t){return t.data[i.label].value}));f.attr({stroke:"#ffffff"}),h.selectAll("text").attr({stroke:"none",fill:"black","font-size":"20px","font-family":"sans-serif"})},a.scatterplot=function(e,r={}){let n=e.head.lets||e.head.vars||[],l=e.results.bindings,i={label_x:r.label_x||n[0]||"x",label_y:r.label_y||n[1]||"y",label_r:r.label_r||n[2]||"r",let_x:r.let_x||n[0],let_y:r.let_y||n[1],let_r:r.let_r||n[2]||5,min_r:r.min_r||1,max_r:r.max_r||20,width:r.width||850,height:r.height||300,margin_x:r.margin_x||80,margin_y:r.margin_y||40,selector:r.selector||null},s=t.extent(l,(function(t){return parseInt(t[i.let_x].value)})),o=t.extent(l,(function(t){return parseInt(t[i.let_y].value)})),c=t.extent(l,(function(t){return parseInt(t[i.let_r]?t[i.let_r].value:i.let_r)})),d=t.scale.linear().range([i.margin_x,i.width-i.margin_x]).domain(s),u=t.scale.linear().range([i.height-i.margin_y,i.margin_y]).domain(o),h=t.scale.linear().range([i.min_r,i.max_r]).domain(c),p=t.svg.axis().scale(d),f=t.svg.axis().scale(u).orient("left"),g=a.select(i.selector,"scatterplot").append("svg").attr("width",i.width).attr("height",i.height),m=g.selectAll("circle").data(l).enter().append("circle").attr("class","node").attr("cx",(function(t){return d(t[i.let_x].value)})).attr("cy",(function(t){return u(t[i.let_y].value)})).attr("r",(function(t){return h(t[i.let_r]?t[i.let_r].value:i.let_r)})).attr("opacity",.5).append("title").text((function(t){return t[i.label_r]?t[i.label_r].value:i.label_r})),y=g.append("g").attr("class","x axis").attr("transform","translate(0,"+(i.height-i.margin_y)+")").call(p),x=g.append("g").attr("class","y axis").attr("transform","translate("+i.margin_x+",0)").call(f);y.append("text").attr("class","label").text(i.label_x).style("text-anchor","middle").attr("transform","translate("+(i.width-i.margin_x)/2+","+(i.margin_y-5)+")"),x.append("text").attr("class","label").text(i.label_y).style("text-anchor","middle").attr("transform","rotate(-90)").attr("x",0-i.height/2).attr("y",0-(i.margin_x-20)),y.attr({stroke:"black",fill:"none"}),x.attr({stroke:"black",fill:"none"}),m.attr({stroke:"gray","stroke-width":"1px",fill:"lightblue",opacity:.5}),g.selectAll("text").attr({stroke:"none",fill:"black","font-size":"8pt","font-family":"sans-serif"})},a.forcegraph=function(e,r={}){let n=e.head&&e.results?a.graph(e,r):e,l=t.scale.linear().domain(t.extent(n.nodes,t=>parseFloat(t.value))).range([1,20]);const i=r.radius||(t=>t.value?l(t.value):1+t.label.length),s=r.charge||-500,o=r.distance||50,c=r.width||1e3,d=r.height||750,u=r.label||!1,h=r.selector||null;let p=a.select(h,"forcegraph").append("svg").attr("width",c).attr("height",d),f=p.selectAll(".link").data(n.links).enter().append("line").attr("class","link"),g=p.selectAll(".node").data(n.nodes).enter().append("g"),m=g.append("circle").attr("class","node").attr("r",i),y=g.append("text").text((function(t){return t[u||"label"]})).attr("class","node"),x=t.layout.force().charge(s).linkDistance(o).size([c,d]).nodes(n.nodes).links(n.links).start();x.on("tick",(function(){f.attr("x1",(function(t){return t.source.x})).attr("y1",(function(t){return t.source.y})).attr("x2",(function(t){return t.target.x})).attr("y2",(function(t){return t.target.y})),y.attr("x",(function(t){return t.x})).attr("y",(function(t){return t.y})),m.attr("cx",(function(t){return t.x})).attr("cy",(function(t){return t.y}))})),g.call(x.drag),f.attr({stroke:"#999999"}),m.attr({stroke:"black","stroke-width":"1px",fill:"lightblue",opacity:1}),y.attr({"font-size":"8px","font-family":"sans-serif"})},a.sankey=function(e,r){r=r||{};let n=e.head&&e.results?a.graph(e,r):e,l={width:r.width||750,height:r.height||1200,margin:r.margin||10,selector:r.selector||null},i=n.nodes,s=n.links;for(let t=0;t<s.length;t++)s[t].value=2;let o=t.sankey().size([l.width,l.height]).nodeWidth(15).nodePadding(10).nodes(i).links(s).layout(32),c=o.link(),d=t.scale.category20(),u=a.select(l.selector,"sankey").append("svg").attr("width",l.width+2*l.margin).attr("height",l.height+2*l.margin).append("g").attr("transform","translate("+l.margin+","+l.margin+")"),h=u.selectAll(".link").data(s).enter().append("path").attr("class","link").attr("d",c).attr("stroke-width",(function(t){return Math.max(1,t.dy)})).sort((function(t,e){return e.dy-t.dy})),p=u.selectAll(".node").data(i).enter().append("g").attr("class","node").attr("transform",(function(t){return"translate("+t.x+","+t.y+")"})).call(t.behavior.drag().origin((function(t){return t})).on("dragstart",(function(){this.parentNode.appendChild(this)})).on("drag",(function(e){t.select(this).attr("transform","translate("+e.x+","+(e.y=Math.max(0,Math.min(l.height-e.dy,t.event.y)))+")"),o.relayout(),h.attr("d",c)})));p.append("rect").attr("width",(function(t){return t.dx})).attr("height",(function(t){return t.dy})).attr("fill",(function(t){return d(t.label)})).attr("opacity",.5),p.append("text").attr("x",-6).attr("y",(function(t){return t.dy/2})).attr("dy",".35em").attr("text-anchor","end").attr("transform",null).text((function(t){return t.label})).filter((function(t){return t.x<l.width/2})).attr("x",6+o.nodeWidth()).attr("text-anchor","start"),h.attr({fill:"none",stroke:"grey",opacity:.5})},a.roundtree=function(e,r){r=r||{};let n=e.head&&e.results?a.tree(e,r):e,l={diameter:r.diameter||800,angle:r.angle||360,depth:r.depth||200,radius:r.radius||5,selector:r.selector||null},i=t.layout.tree().size([l.angle,l.depth]).separation((function(t,e){return(t.parent===e.parent?1:2)/t.depth})),s=i.nodes(n),o=i.links(s),c=t.svg.diagonal.radial().projection((function(t){return[t.y,t.x/180*Math.PI]})),d=a.select(l.selector,"roundtree").append("svg").attr("width",l.diameter).attr("height",l.diameter).append("g").attr("transform","translate("+l.diameter/2+","+l.diameter/2+")"),u=d.selectAll(".link").data(o).enter().append("path").attr("class","link").attr("d",c),h=d.selectAll(".node").data(s).enter().append("g").attr("class","node").attr("transform",(function(t){return"rotate("+(t.x-90)+") translate("+t.y+")"})),p=h.append("circle").attr("r",l.radius),f=h.append("text").attr("dy",".35em").attr("text-anchor",(function(t){return t.x<180?"start":"end"})).attr("transform",(function(t){return t.x<180?"translate(8)":"rotate(180) translate(-8)"})).text((function(t){return t.name}));u.attr({fill:"none",stroke:"#cccccc","stroke-width":"1.5px"}),p.attr({fill:"#ffffff",stroke:"steelblue","stroke-width":"1.5px",opacity:1}),f.attr({"font-size":"10px","font-family":"sans-serif"})},a.dendrogram=function(e,r={}){let n=e.head&&e.results?a.tree(e,r):e,l={width:r.width||800,height:r.height||2e3,margin:r.margin||350,radius:r.radius||5,selector:r.selector||null},i=t.layout.cluster().size([l.height,l.width-l.margin]),s=t.svg.diagonal().projection((function(t){return[t.y,t.x]})),o=a.select(l.selector,"dendrogram").append("svg").attr("width",l.width).attr("height",l.height).append("g").attr("transform","translate(40,0)"),c=i.nodes(n),d=i.links(c),u=o.selectAll(".link").data(d).enter().append("path").attr("class","link").attr("d",s),h=o.selectAll(".node").data(c).enter().append("g").attr("class","node").attr("transform",(function(t){return"translate("+t.y+","+t.x+")"})),p=h.append("circle").attr("r",l.radius),f=h.append("text").attr("dx",(function(t){return t.parent&&t.children?-8:8})).attr("dy",5).style("text-anchor",(function(t){return t.parent&&t.children?"end":"start"})).text((function(t){return t.name}));u.attr({fill:"none",stroke:"#cccccc","stroke-width":"1.5px"}),p.attr({fill:"#ffffff",stroke:"steelblue","stroke-width":"1.5px",opacity:1}),f.attr({"font-size":"10px","font-family":"sans-serif"})},a.sunburst=function(e,r={}){let n=e.head&&e.results?a.tree(e,r):e,l={width:r.width||1e3,height:r.height||900,margin:r.margin||150,selector:r.selector||null},i=Math.min(l.width,l.height)/2-l.margin,s=t.scale.linear().range([0,2*Math.PI]),o=t.scale.sqrt().range([0,i]),c=t.scale.category20(),d=a.select(l.selector,"sunburst").append("svg").attr("width",l.width).attr("height",l.height).append("g").attr("transform","translate("+l.width/2+","+l.height/2+")"),u=t.svg.arc().startAngle((function(t){return Math.max(0,Math.min(2*Math.PI,s(t.x)))})).endAngle((function(t){return Math.max(0,Math.min(2*Math.PI,s(t.x+t.dx)))})).innerRadius((function(t){return Math.max(0,o(t.y))})).outerRadius((function(t){return Math.max(0,o(t.y+t.dy))})),h=t.layout.partition().value((function(t){return t.value})).nodes(n),p=d.selectAll("path").data(h).enter().append("path").attr("d",u).attr("class","arc").style("fill",(function(t){return c((t.children?t:t.parent).name)})).on("click",g),f=d.selectAll("text").data(h).enter().append("text").attr("transform",(function(t){return"rotate("+(180*s(t.x+t.dx/2)/Math.PI-90)+") translate("+o(t.y)+")"})).attr("dx",".5em").attr("dy",".35em").text((function(t){return t.name})).on("click",g);function g(e){p.transition().duration(750).attrTween("d",function(e){let a=t.interpolate(s.domain(),[e.x,e.x+e.dx]),r=t.interpolate(o.domain(),[e.y,m(e)]),n=t.interpolate(o.range(),[e.y?20:0,i]);return t=>e=>(s.domain(a(e)),o.domain(r(e)).range(n(e)),u(t))}(e)),f.style("visibility",(function(a){return y(e,a)?null:t.select(this).style("visibility")})).transition().duration(750).attrTween("transform",(function(t){return function(){return"rotate("+(180*s(t.x+t.dx/2)/Math.PI-90)+") translate("+o(t.y)+")"}})).each("end",(function(a){t.select(this).style("visibility",y(e,a)?null:"hidden")}))}function m(t){return t.children?Math.max.apply(Math,t.children.map(m)):t.y+t.dy}function y(t,e){return t===e||!!t.children&&t.children.some(t=>y(t,e))}p.attr({stroke:"#ffffff","fill-rule":"evenodd"}),f.attr({"font-size":"10px","font-family":"sans-serif"})},a.circlepack=function(e,r={}){let n=e.head&&e.results?a.tree(e,r):e,l={width:r.width||800,height:r.height||800,diameter:r.diameter||700,selector:r.selector||null},i=l.width,s=l.height,o=l.diameter,c=t.scale.linear().range([0,o]),d=t.scale.linear().range([0,o]),u=t.layout.pack().size([o,o]).value((function(t){return t.value})),h=n,p=u.nodes(n),f=a.select(l.selector,"circlepack").append("svg").attr("width",i).attr("height",s).append("g").attr("transform","translate("+(i-o)/2+","+(s-o)/2+")");function g(e,a){let r=o/e.r/2;c.domain([e.x-e.r,e.x+e.r]),d.domain([e.y-e.r,e.y+e.r]);let n=f.transition().duration(t.event.altKey?2e3:500);n.selectAll("circle").attr("cx",(function(t){return c(t.x)})).attr("cy",(function(t){return d(t.y)})).attr("r",(function(t){return r*t.r})),n.selectAll("text").attr("x",(function(t){return c(t.x)})).attr("y",(function(t){return d(t.y)})).style("opacity",(function(t){return r*t.r>20?1:0})),t.event.stopPropagation()}f.selectAll("circle").data(p).enter().append("circle").attr("class",(function(t){return t.children?"parent":"child"})).attr("cx",(function(t){return t.x})).attr("cy",(function(t){return t.y})).attr("r",(function(t){return t.r})).on("click",(function(t){return g(h===t?n:t)})),f.selectAll("text").data(p).enter().append("text").attr("class",(function(t){return t.children?"parent":"child"})).attr("x",(function(t){return t.x})).attr("y",(function(t){return t.y})).style("opacity",(function(t){return t.r>20?1:0})).text((function(t){return t.name})).attr("text-anchor","start").transition().duration(1e3).attr("transform",(function(t){return"rotate(-30, "+t.x+", "+t.y+")"})),t.select(window).on("click",(function(){g(n)}))},a.treemap=function(e,r={}){let n=e.head&&e.results?a.tree(e,r):e,l=r.width||800,i=r.height||500,s=r.count||!1,o=r.color||t.scale.category20c(),c=r.margin||{top:0,right:0,bottom:0,left:0},d=r.selector||null;l=l-c.left-c.right,i=i-c.top-c.bottom;let u=t.layout.treemap().size([l,i]).sticky(!0).value(s?t=>1:t=>t.value);a.select(d,"treemap").style("position","relative").style("width",l+"px").style("height",i+"px").style("left",c.left+"px").style("top",c.top+"px").datum(n).selectAll(".node").data(u.nodes).enter().append("div").attr("class","node").call((function(){this.style("left",(function(t){return t.x+"px"})).style("top",(function(t){return t.y+"px"})).style("width",(function(t){return Math.max(0,t.dx-1)+"px"})).style("height",(function(t){return Math.max(0,t.dy-1)+"px"}))})).style("background",t=>t.children?o(t.name):null).text(t=>t.children?null:t.name).style({"border-style":"solid","border-width":"1px","border-color":"white","font-size":"10px","font-family":"sans-serif","line-height":"12px",overflow:"hidden",position:"absolute","text-indent":"2px"})},a.treemapzoom=function(e,r={}){let n,l=e.head&&e.results?a.tree(e,r):e,i={width:r.width||800,height:r.height||500,margin:r.margin||{top:25,right:0,bottom:0,left:0},color:r.color||t.scale.category20(),format:r.format||t.format(",d"),selector:r.selector||null},s=i.width-i.margin.left-i.margin.right,o=i.height-i.margin.top-i.margin.bottom,c=i.color,d=i.format,u=t.scale.linear().domain([0,s]).range([0,s]),h=t.scale.linear().domain([0,o]).range([0,o]),p=t.layout.treemap().children((function(t,e){return e?null:t.children})).sort((function(t,e){return t.value-e.value})).ratio(o/s*.5*(1+Math.sqrt(5))).round(!1),f=a.select(i.selector,"treemapzoom").append("svg").attr("width",i.width).attr("height",i.height).style("margin-left",-i.margin.left+"px").style("margin.right",-i.margin.right+"px").append("g").attr("transform","translate("+i.margin.left+","+i.margin.top+")").style("shape-rendering","crispEdges"),g=f.append("g").attr("class","grandparent");g.append("rect").attr("y",-i.margin.top).attr("width",s).attr("height",i.margin.top).attr("fill","#666666"),g.append("text").attr("x",6).attr("y",6-i.margin.top).attr("dy",".75em").attr("stroke","#ffffff").attr("fill","#ffffff");let m=t=>{t.children&&(p.nodes({children:t.children}),t.children.forEach(e=>{e.x=t.x+e.x*t.dx,e.y=t.y+e.y*t.dy,e.dx*=t.dx,e.dy*=t.dy,e.parent=t,m(e)}))};function y(t){t.attr("x",(function(t){return u(t.x)+6})).attr("y",(function(t){return h(t.y)+6}))}function x(t){t.attr("x",(function(t){return u(t.x)})).attr("y",(function(t){return h(t.y)})).attr("width",(function(t){return u(t.x+t.dx)-u(t.x)})).attr("height",(function(t){return h(t.y+t.dy)-h(t.y)})).attr("fill",(function(t){return c(t.name)})),t.attr({stroke:"#ffffff","stroke-width":"1px",opacity:.8})}(t=>{t.x=t.y=0,t.dx=s,t.dy=o,t.depth=0})(l),m(l),function t(e){g.datum(e.parent).on("click",l).select("text").text(function t(e){return e.parent?t(e.parent)+" / "+e.name:e.name}(e));let a=f.insert("g",".grandparent").datum(e).attr("class","depth"),r=a.selectAll("g").data(e.children).enter().append("g");function l(e){if(n||!e)return;n=!0;let r=t(e),l=a.transition().duration(750),i=r.transition().duration(750);u.domain([e.x,e.x+e.dx]),h.domain([e.y,e.y+e.dy]),f.style("shape-rendering",null),f.selectAll(".depth").sort((function(t,e){return t.depth-e.depth})),r.selectAll("text").style("fill-opacity",0),l.selectAll("text").call(y).style("fill-opacity",0),i.selectAll("text").call(y).style("fill-opacity",1),l.selectAll("rect").call(x),i.selectAll("rect").call(x),l.remove().each("end",(function(){f.style("shape-rendering","crispEdges"),n=!1}))}return r.filter((function(t){return t.children})).classed("children",!0).on("click",l),r.selectAll(".child").data((function(t){return t.children||[t]})).enter().append("rect").attr("class","child").call(x),r.append("rect").attr("class","parent").call(x).append("title").text((function(t){return d(t.value)})),r.append("text").attr("dy",".75em").text((function(t){return t.name})).call(y),r}(l)},a.coordmap=function(r,n={}){let l=r.head.lets||r.head.vars||[],i=r.results.bindings,s={let_lat:n.let_lat||l[0]||"lat",let_lng:n.let_lng||l[1]||"lng",width:n.width||960,height:n.height||480,radius:n.radius||5,color:n.color||"#FF3333",topojson:n.topojson||"world-50m.json",selector:n.selector||null},o=t.geo.equirectangular().scale(153).translate([s.width/2,s.height/2]).precision(.1),c=t.geo.path().projection(o),d=t.geo.graticule(),u=a.select(s.selector,"coordmap").append("svg").attr("width",s.width).attr("height",s.height);u.append("path").datum(d.outline).attr("fill","#a4bac7").attr("d",c),u.append("path").datum(d).attr("fill","none").attr("stroke","#333333").attr("stroke-width",".5px").attr("stroke-opacity",".5").attr("d",c),t.json(s.topojson,(function(t,a){u.insert("path",".graticule").datum(e.feature(a,a.objects.land)).attr("fill","#d7c7ad").attr("stroke","#766951").attr("d",c),u.insert("path",".graticule").datum(e.mesh(a,a.objects.countries,(function(t,e){return t!==e}))).attr("class","boundary").attr("fill","none").attr("stroke","#a5967e").attr("stroke-width",".5px").attr("d",c),u.selectAll(".pin").data(i).enter().append("circle",".pin").attr("fill",s.color).attr("r",s.radius).attr("stroke","#455346").attr("transform",(function(t){return"translate("+o([t[s.let_lng].value,t[s.let_lat].value])+")"}))}))},a.namedmap=function(n,l={}){let i=n.head.lets||n.head.vars||[],s=n.results.bindings,o={label:l.label||i[0]||"label",value:l.value||i[1]||"value",width:l.width||1e3,height:l.height||1e3,color_max:l.color_max||"red",color_min:l.color_min||"white",color_scale:l.color_scale||"log",topojson:l.topojson||"japan.topojson",mapname:l.mapname||"japan",keyname:l.keyname||"name_local",center_lat:l.center_lat||34,center_lng:l.center_lng||137,scale:l.scale||1e4,selector:l.selector||null},c=t.nest().key(t=>t[o.label].value).rollup(e=>t.sum(e,t=>parseInt(t[o.value].value))).map(s,t.map),d=t.extent(t.map(c).values());r(c);let u=a.select(o.selector,"namedmap").append("svg").attr("width",o.width).attr("height",o.height);t.json(o.topojson,(function(a){let r,n=e.object(a,a.objects[o.mapname]).geometries,l=t.geo.mercator().center([o.center_lng,o.center_lat]).translate([o.width/2,o.height/2]).scale(o.scale),i=t.geo.path().projection(l);switch(o.color_scale){case"log":r=t.scale.log();break;default:r=t.scale.linear()}let s=r.domain(d).range([o.color_min,o.color_max]);u.selectAll("path").data(n).enter().append("path").attr("d",i).attr("stroke","black").attr("stroke-width",.5).style("fill",(function(t,e){return s(c[t.properties[o.keyname]])})),u.selectAll(".place-label").data(n).enter().append("text").attr("font-size","8px").attr("class","place-label").attr("transform",(function(t){let e=t.properties.latitude,a=t.properties.longitude;return"translate("+l([a,e])+")"})).attr("dx","-1.5em").text(t=>t.properties[o.keyname])}))},a.select=function(e,a){return(e?t.select(e).html(""):t.select("body")).append("div").attr("class","d3sparql "+a)},a.toggle=function(){let e=t.select("#button"),a=t.select("#sparql");"none"===a.style("display")?(a.style("display","inline"),e.attr("class","icon-chevron-up")):(a.style("display","none"),e.attr("class","icon-chevron-down"))},a.frameheight=function(e){t.select(self.frameElement).style("height",e+"px")},a}));
//# sourceMappingURL=d3sparql.umd.js.map
