!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e(require("d3"),require("d3-sankey"),require("topojson-client")):"function"==typeof define&&define.amd?define(["d3","d3-sankey","topojson-client"],e):(t=t||self).d3sparql=e(t.d3,null,t.topojson)}(this,(function(t,e,a){"use strict";t=t&&Object.prototype.hasOwnProperty.call(t,"default")?t.default:t;const r={version:"d3sparql.js version 2020-04-25",debug:!1};function n(...t){if(r.debug){const e=[];for(const a of t)switch(typeof a){case"object":e.push(JSON.stringify(a));break;default:e.push(a)}console.debug(...e)}}return r.fetch=async(t,e={})=>{n(t,e);const a=await fetch(t,{...e,headers:{...e.headers,Accept:"application/sparql-results+json"}});if(!a.ok)throw new Error(await a.text());return a.json()},r.query=function(t,e,a="GET"){const n=new URL(t);if("GET"===a)return n.search="query="+encodeURIComponent(e),r.fetch(n.href);if("POST"===a){const t=new FormData;t.append("query",e);const a=new URLSearchParams([...t.entries()]);return r.fetch(n.href,{body:a,method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"}})}throw new TypeError("unsupported query type: "+a)},r.graph=function(t,e={}){let a=t.head.lets||t.head.vars||[],r=t.results.bindings,l=e.key1||a[0]||"key1",s=e.key2||a[1]||"key2",i=e.label1||a[2]||!1,o=e.label2||a[3]||!1,c=e.value1||a[4]||!1,d=e.value2||a[5]||!1,p={nodes:[],links:[]},u=new Map,h=0;for(let t=0;t<r.length;t++){let e=r[t],a=e[l].value,n=e[s].value,f=i?e[i].value:a,g=o?e[o].value:n,y=!!c&&e[c].value,m=!!d&&e[d].value;u.has(a)||(p.nodes.push({key:a,label:f,value:y}),u.set(a,h),h++),u.has(n)||(p.nodes.push({key:n,label:g,value:m}),u.set(n,h),h++),p.links.push({source:u.get(a),target:u.get(n)})}return n(p),p},r.tree=function(e,a={}){let r=e.head.lets||e.head.vars||[],l=e.results.bindings,s=a.root||r[0],i=a.parent||r[1],o=a.child||r[2],c=a.value||r[3]||"value",d=new Map,p=new Map,u=l[0][s].value,h=!0,f=h;for(let t=0;t<l.length;t++){const e=l[t];if(h=e[i].value,f=e[o].value,h!==f){let t;d.has(h)?(t=d.get(h),t.push(f)):t=[f],d.set(h,t),e[c]&&p.set(f,e[c].value)}}let g=e=>{let a=d.get(e);if(!a)return{name:e,value:p.get(e)||1};let r=a.map(t=>g(t)),n=t.sum(r,t=>t.value);return{name:e,children:r,value:t.sum([n,p.get(e)])}},y=g(u);return n(y),y},r.htmltable=function(t,e={}){let a=t.head.lets||t.head.vars||[],l=t.results.bindings,s=e.columns||a,i=e.headers||s,o=e.selector||null,c=void 0!==e.limit?e.limit:l.length,d=void 0!==e.offset?e.offset:0;l=l.slice(d,d+c);let p=r.select(o,"htmltable").append("table").attr("class","table table-bordered");n("Table"),n(p);let u=p.append("thead"),h=p.append("tbody");u.append("tr").selectAll("th").data(i).enter().append("th").text(t=>t);let f=h.selectAll("tr").data(l).enter().append("tr").selectAll("td").data(t=>s.map(e=>t[e]?t[e].value:"")).enter().append("td").text(t=>t);n("Table cells"),n(f),p.style({margin:"10px"}),p.selectAll("th").style({background:"#eeeeee","text-transform":"capitalize"})},r.htmlhash=function(t,e={}){let a=t.head.lets||t.head.vars||[],n=t.results.bindings[0],l=e.selector||null,s=r.select(l,"htmlhash").append("table").attr("class","table table-bordered"),i=s.append("tbody").selectAll("tr").data(()=>a.map(t=>({head:t,data:n[t]?n[t].value:""}))).enter().append("tr");i.append("th").text(t=>t.head),i.append("td").text(t=>t.data),s.style({margin:"10px"}),s.selectAll("th").style({background:"#eeeeee","text-transform":"capitalize"})},r.barchart=function(e,a={}){let n=e.head.lets||e.head.vars||[],l=e.results.bindings,s=a.label_x||n[0],i=a.label_y||n[1],o=a.let_x||n[0],c=a.let_y||n[1],d=a.width||750,p=a.height||300,u=a.margin||80,h=a.selector||null,f=t.scale.ordinal().rangeRoundBands([0,d-u],.1),g=t.scale.linear().range([p-u,0]),y=t.svg.axis().scale(f).orient("bottom"),m=t.svg.axis().scale(g).orient("left");f.domain(l.map(t=>t[o].value)),g.domain(t.extent(l,t=>parseInt(t[c].value)));let x=r.select(h,"barchart").append("svg").attr("width",d).attr("height",p),v=x.append("g").attr("class","axis x").attr("transform","translate("+u+","+(p-u)+")").call(y),b=x.append("g").attr("class","axis y").attr("transform","translate("+u+",0)").call(m),k=x.selectAll(".bar").data(l).enter().append("rect").attr("transform","translate("+u+",0)").attr("class","bar").attr("x",t=>f(t[o].value)).attr("width",f.rangeBand()).attr("y",t=>g(t[c].value)).attr("height",t=>p-g(parseInt(t[c].value))-u);v.selectAll("text").attr("dy",".35em").attr("x",10).attr("y",0).attr("transform","rotate(90)").style("text-anchor","start"),v.append("text").attr("class","label").text(s).style("text-anchor","middle").attr("transform","translate("+(d-u)/2+","+(u-5)+")"),b.append("text").attr("class","label").text(i).style("text-anchor","middle").attr("transform","rotate(-90)").attr("x",0-p/2).attr("y",0-(u-20)),k.attr({fill:"steelblue"}),x.selectAll(".axis").attr({stroke:"black",fill:"none","shape-rendering":"crispEdges"}),x.selectAll("text").attr({stroke:"none",fill:"black","font-size":"8pt","font-family":"sans-serif"})},r.piechart=function(e,a={}){let n=e.head.lets||e.head.vars||[],l=e.results.bindings,s=a.label||n[0],i=a.size||n[1],o=a.width||700,c=a.height||700,d=a.margin||10,p=a.selector||null,u=a.hole||100,h=Math.min(o,c)/2-d,f=Math.max(Math.min(h-50,u),0),g=t.scale.category20(),y=t.svg.arc().outerRadius(h).innerRadius(f),m=t.layout.pie().value(t=>t[i].value),x=r.select(p,"piechart").append("svg").attr("width",o).attr("height",c).append("g").attr("transform","translate("+o/2+","+c/2+")"),v=x.selectAll(".arc").data(m(l)).enter().append("g").attr("class","arc"),b=v.append("path").attr("d",y).attr("fill",(t,e)=>g(e));v.append("text").attr("class","label").attr("transform",t=>`translate(${y.centroid(t)})`).attr("dy",".35em").attr("text-anchor","middle").text(t=>t.data[s].value);b.attr({stroke:"#ffffff"}),x.selectAll("text").attr({stroke:"none",fill:"black","font-size":"20px","font-family":"sans-serif"})},r.scatterplot=function(e,a={}){let n=e.head.lets||e.head.vars||[],l=e.results.bindings,s=a.label_x||n[0]||"x",i=a.label_y||n[1]||"y",o=a.label_r||n[2]||"r",c=a.let_x||n[0],d=a.let_y||n[1],p=a.let_r||n[2]||5,u=a.min_r||1,h=a.max_r||20,f=a.width||850,g=a.height||300,y=a.margin_x||80,m=a.margin_y||40,x=a.selector||null,v=t.extent(l,t=>parseInt(t[c].value)),b=t.extent(l,t=>parseInt(t[d].value)),k=t.extent(l,t=>parseInt(t[p]?t[p].value:p)),w=t.scale.linear().range([y,f-y]).domain(v),A=t.scale.linear().range([g-m,m]).domain(b),M=t.scale.linear().range([u,h]).domain(k),j=t.svg.axis().scale(w),_=t.svg.axis().scale(A).orient("left"),z=r.select(x,"scatterplot").append("svg").attr("width",f).attr("height",g),$=z.selectAll("circle").data(l).enter().append("circle").attr("class","node").attr("cx",t=>w(t[c].value)).attr("cy",t=>A(t[d].value)).attr("r",t=>M(t[p]?t[p].value:p)).attr("opacity",.5).append("title").text(t=>t[o]?t[o].value:o),q=z.append("g").attr("class","x axis").attr("transform","translate(0,"+(g-m)+")").call(j),I=z.append("g").attr("class","y axis").attr("transform","translate("+y+",0)").call(_);q.append("text").attr("class","label").text(s).style("text-anchor","middle").attr("transform","translate("+(f-y)/2+","+(m-5)+")"),I.append("text").attr("class","label").text(i).style("text-anchor","middle").attr("transform","rotate(-90)").attr("x",0-g/2).attr("y",0-(y-20)),q.attr({stroke:"black",fill:"none"}),I.attr({stroke:"black",fill:"none"}),$.attr({stroke:"gray","stroke-width":"1px",fill:"lightblue",opacity:.5}),z.selectAll("text").attr({stroke:"none",fill:"black","font-size":"8pt","font-family":"sans-serif"})},r.forcegraph=function(e,a={}){let n=e.head&&e.results?r.graph(e,a):e,l=a.radius||(t=>t.value?u(t.value):1+t.label.length),s=a.charge||-500,i=a.distance||50,o=a.width||1e3,c=a.height||750,d=a.label||!1,p=a.selector||null,u=t.scale.linear().domain(t.extent(n.nodes,t=>parseFloat(t.value))).range([1,20]),h=r.select(p,"forcegraph").append("svg").attr("width",o).attr("height",c),f=h.selectAll(".link").data(n.links).enter().append("line").attr("class","link"),g=h.selectAll(".node").data(n.nodes).enter().append("g"),y=g.append("circle").attr("class","node").attr("r",l),m=g.append("text").text(t=>t[d||"label"]).attr("class","node"),x=t.layout.force().charge(s).linkDistance(i).size([o,c]).nodes(n.nodes).links(n.links).start();x.on("tick",()=>{f.attr("x1",t=>t.source.x).attr("y1",t=>t.source.y).attr("x2",t=>t.target.x).attr("y2",t=>t.target.y),m.attr("x",t=>t.x).attr("y",t=>t.y),y.attr("cx",t=>t.x).attr("cy",t=>t.y)}),g.call(x.drag),f.attr({stroke:"#999999"}),y.attr({stroke:"black","stroke-width":"1px",fill:"lightblue",opacity:1}),m.attr({"font-size":"8px","font-family":"sans-serif"})},r.sankey=function(e,a={}){let n=e.head&&e.results?r.graph(e,a):e,l=a.width||750,s=a.height||1200,i=a.margin||10,o=a.selector||null,c=n.nodes,d=n.links;for(let t=0;t<d.length;t++)d[t].value=2;let p=t.sankey().size([l,s]).nodeWidth(15).nodePadding(10).nodes(c).links(d).layout(32),u=p.link(),h=t.scale.category20(),f=r.select(o,"sankey").append("svg").attr("width",l+2*i).attr("height",s+2*i).append("g").attr("transform",`translate(${i},${i})`),g=f.selectAll(".link").data(d).enter().append("path").attr("class","link").attr("d",u).attr("stroke-width",t=>Math.max(1,t.dy)).sort((t,e)=>e.dy-t.dy),y=f.selectAll(".node").data(c).enter().append("g").attr("class","node").attr("transform",t=>`translate(${t.x},${t.y})`).call(t.behavior.drag().origin(t=>t).on("dragstart",(function(){this.parentNode.appendChild(this)})).on("drag",(function(e){t.select(this).attr("transform",`translate(${e.x},${e.y=Math.max(0,Math.min(s-e.dy,t.event.y))})`),p.relayout(),g.attr("d",u)})));y.append("rect").attr("width",t=>t.dx).attr("height",t=>t.dy).attr("fill",t=>h(t.label)).attr("opacity",.5),y.append("text").attr("x",-6).attr("y",t=>t.dy/2).attr("dy",".35em").attr("text-anchor","end").attr("transform",null).text(t=>t.label).filter(t=>t.x<l/2).attr("x",6+p.nodeWidth()).attr("text-anchor","start"),g.attr({fill:"none",stroke:"grey",opacity:.5})},r.roundtree=function(e,a={}){let n=e.head&&e.results?r.tree(e,a):e,l=a.diameter||800,s=a.angle||360,i=a.depth||200,o=a.radius||5,c=a.selector||null,d=t.layout.tree().size([s,i]).separation((t,e)=>(t.parent===e.parent?1:2)/t.depth),p=d.nodes(n),u=d.links(p),h=t.svg.diagonal.radial().projection(t=>[t.y,t.x/180*Math.PI]),f=r.select(c,"roundtree").append("svg").attr("width",l).attr("height",l).append("g").attr("transform",`translate(${l/2},${l/2})`),g=f.selectAll(".link").data(u).enter().append("path").attr("class","link").attr("d",h),y=f.selectAll(".node").data(p).enter().append("g").attr("class","node").attr("transform",t=>`rotate(${t.x-90}) translate(${t.y})`),m=y.append("circle").attr("r",o),x=y.append("text").attr("dy",".35em").attr("text-anchor",t=>t.x<180?"start":"end").attr("transform",t=>t.x<180?"translate(8)":"rotate(180) translate(-8)").text(t=>t.name);g.attr({fill:"none",stroke:"#cccccc","stroke-width":"1.5px"}),m.attr({fill:"#ffffff",stroke:"steelblue","stroke-width":"1.5px",opacity:1}),x.attr({"font-size":"10px","font-family":"sans-serif"})},r.dendrogram=function(e,a={}){let n=e.head&&e.results?r.tree(e,a):e,l=a.width||800,s=a.height||2e3,i=a.margin||350,o=a.radius||5,c=a.selector||null,d=t.layout.cluster().size([s,l-i]),p=t.svg.diagonal().projection(t=>[t.y,t.x]),u=r.select(c,"dendrogram").append("svg").attr("width",l).attr("height",s).append("g").attr("transform","translate(40,0)"),h=d.nodes(n),f=d.links(h),g=u.selectAll(".link").data(f).enter().append("path").attr("class","link").attr("d",p),y=u.selectAll(".node").data(h).enter().append("g").attr("class","node").attr("transform",t=>`translate(${t.y},${t.x})`),m=y.append("circle").attr("r",o),x=y.append("text").attr("dx",t=>t.parent&&t.children?-8:8).attr("dy",5).style("text-anchor",t=>t.parent&&t.children?"end":"start").text(t=>t.name);g.attr({fill:"none",stroke:"#cccccc","stroke-width":"1.5px"}),m.attr({fill:"#ffffff",stroke:"steelblue","stroke-width":"1.5px",opacity:1}),x.attr({"font-size":"10px","font-family":"sans-serif"})},r.sunburst=function(e,a={}){let n=e.head&&e.results?r.tree(e,a):e,l=a.width||1e3,s=a.height||900,i=a.margin||150,o=a.selector||null,c=Math.min(l,s)/2-i,d=t.scale.linear().range([0,2*Math.PI]),p=t.scale.sqrt().range([0,c]),u=t.scale.category20(),h=r.select(o,"sunburst").append("svg").attr("width",l).attr("height",s).append("g").attr("transform",`translate(${l/2},${s/2})`),f=t.svg.arc().startAngle(t=>Math.max(0,Math.min(2*Math.PI,d(t.x)))).endAngle(t=>Math.max(0,Math.min(2*Math.PI,d(t.x+t.dx)))).innerRadius(t=>Math.max(0,p(t.y))).outerRadius(t=>Math.max(0,p(t.y+t.dy))),g=t.layout.partition().value(t=>t.value).nodes(n),y=h.selectAll("path").data(g).enter().append("path").attr("d",f).attr("class","arc").style("fill",t=>u((t.children?t:t.parent).name)).on("click",b),m=h.selectAll("text").data(g).enter().append("text").attr("transform",t=>`rotate(${180*d(t.x+t.dx/2)/Math.PI-90}) translate(${p(t.y)})`).attr("dx",".5em").attr("dy",".35em").text(t=>t.name).on("click",b);y.attr({stroke:"#ffffff","fill-rule":"evenodd"}),m.attr({"font-size":"10px","font-family":"sans-serif"});let x=t=>t.children?Math.max.apply(Math,t.children.map(x)):t.y+t.dy,v=(t,e)=>t===e||!!t.children&&t.children.some(t=>v(t,e));function b(e){y.transition().duration(750).attrTween("d",(e=>{let a=t.interpolate(d.domain(),[e.x,e.x+e.dx]),r=t.interpolate(p.domain(),[e.y,x(e)]),n=t.interpolate(p.range(),[e.y?20:0,c]);return t=>e=>(d.domain(a(e)),p.domain(r(e)).range(n(e)),f(t))})(e)),m.style("visibility",(function(a){return v(e,a)?null:t.select(this).style("visibility")})).transition().duration(750).attrTween("transform",t=>()=>`rotate(${180*d(t.x+t.dx/2)/Math.PI-90}) translate(${p(t.y)})`).each("end",(function(a){t.select(this).style("visibility",v(e,a)?null:"hidden")}))}},r.circlepack=function(e,a={}){let n=e.head&&e.results?r.tree(e,a):e,l=a.width||800,s=a.height||800,i=a.diameter||700,o=a.selector||null,c=l,d=s,p=i,u=t.scale.linear().range([0,p]),h=t.scale.linear().range([0,p]),f=t.layout.pack().size([p,p]).value(t=>t.value),g=n,y=f.nodes(n),m=r.select(o,"circlepack").append("svg").attr("width",c).attr("height",d).append("g").attr("transform","translate("+(c-p)/2+","+(d-p)/2+")");function x(e,a){let r=p/e.r/2;u.domain([e.x-e.r,e.x+e.r]),h.domain([e.y-e.r,e.y+e.r]);let n=m.transition().duration(t.event.altKey?2e3:500);n.selectAll("circle").attr("cx",(function(t){return u(t.x)})).attr("cy",(function(t){return h(t.y)})).attr("r",(function(t){return r*t.r})),n.selectAll("text").attr("x",(function(t){return u(t.x)})).attr("y",(function(t){return h(t.y)})).style("opacity",(function(t){return r*t.r>20?1:0})),t.event.stopPropagation()}m.selectAll("circle").data(y).enter().append("circle").attr("class",(function(t){return t.children?"parent":"child"})).attr("cx",(function(t){return t.x})).attr("cy",(function(t){return t.y})).attr("r",(function(t){return t.r})).on("click",(function(t){return x(g===t?n:t)})),m.selectAll("text").data(y).enter().append("text").attr("class",(function(t){return t.children?"parent":"child"})).attr("x",(function(t){return t.x})).attr("y",(function(t){return t.y})).style("opacity",(function(t){return t.r>20?1:0})).text((function(t){return t.name})).attr("text-anchor","start").transition().duration(1e3).attr("transform",(function(t){return"rotate(-30, "+t.x+", "+t.y+")"})),t.select(window).on("click",(function(){x(n)}))},r.treemap=function(e,a={}){let n=e.head&&e.results?r.tree(e,a):e,l=a.width||800,s=a.height||500,i=a.count||!1,o=a.color||t.scale.category20c(),c=a.margin||{top:0,right:0,bottom:0,left:0},d=a.selector||null;l=l-c.left-c.right,s=s-c.top-c.bottom;let p=t.layout.treemap().size([l,s]).sticky(!0).value(i?t=>1:t=>t.value);r.select(d,"treemap").style("position","relative").style("width",l+"px").style("height",s+"px").style("left",c.left+"px").style("top",c.top+"px").datum(n).selectAll(".node").data(p.nodes).enter().append("div").attr("class","node").call((function(){this.style("left",(function(t){return t.x+"px"})).style("top",(function(t){return t.y+"px"})).style("width",(function(t){return Math.max(0,t.dx-1)+"px"})).style("height",(function(t){return Math.max(0,t.dy-1)+"px"}))})).style("background",t=>t.children?o(t.name):null).text(t=>t.children?null:t.name).style({"border-style":"solid","border-width":"1px","border-color":"white","font-size":"10px","font-family":"sans-serif","line-height":"12px",overflow:"hidden",position:"absolute","text-indent":"2px"})},r.treemapzoom=function(e,a={}){let n,l=e.head&&e.results?r.tree(e,a):e,s={width:a.width||800,height:a.height||500,margin:a.margin||{top:25,right:0,bottom:0,left:0},color:a.color||t.scale.category20(),format:a.format||t.format(",d"),selector:a.selector||null},i=s.width-s.margin.left-s.margin.right,o=s.height-s.margin.top-s.margin.bottom,c=s.color,d=s.format,p=t.scale.linear().domain([0,i]).range([0,i]),u=t.scale.linear().domain([0,o]).range([0,o]),h=t.layout.treemap().children((function(t,e){return e?null:t.children})).sort((function(t,e){return t.value-e.value})).ratio(o/i*.5*(1+Math.sqrt(5))).round(!1),f=r.select(s.selector,"treemapzoom").append("svg").attr("width",s.width).attr("height",s.height).style("margin-left",-s.margin.left+"px").style("margin.right",-s.margin.right+"px").append("g").attr("transform","translate("+s.margin.left+","+s.margin.top+")").style("shape-rendering","crispEdges"),g=f.append("g").attr("class","grandparent");g.append("rect").attr("y",-s.margin.top).attr("width",i).attr("height",s.margin.top).attr("fill","#666666"),g.append("text").attr("x",6).attr("y",6-s.margin.top).attr("dy",".75em").attr("stroke","#ffffff").attr("fill","#ffffff");let y=t=>{t.children&&(h.nodes({children:t.children}),t.children.forEach(e=>{e.x=t.x+e.x*t.dx,e.y=t.y+e.y*t.dy,e.dx*=t.dx,e.dy*=t.dy,e.parent=t,y(e)}))};function m(t){t.attr("x",(function(t){return p(t.x)+6})).attr("y",(function(t){return u(t.y)+6}))}function x(t){t.attr("x",(function(t){return p(t.x)})).attr("y",(function(t){return u(t.y)})).attr("width",(function(t){return p(t.x+t.dx)-p(t.x)})).attr("height",(function(t){return u(t.y+t.dy)-u(t.y)})).attr("fill",(function(t){return c(t.name)})),t.attr({stroke:"#ffffff","stroke-width":"1px",opacity:.8})}(t=>{t.x=t.y=0,t.dx=i,t.dy=o,t.depth=0})(l),y(l),function t(e){g.datum(e.parent).on("click",l).select("text").text(function t(e){return e.parent?t(e.parent)+" / "+e.name:e.name}(e));let a=f.insert("g",".grandparent").datum(e).attr("class","depth"),r=a.selectAll("g").data(e.children).enter().append("g");function l(e){if(n||!e)return;n=!0;let r=t(e),l=a.transition().duration(750),s=r.transition().duration(750);p.domain([e.x,e.x+e.dx]),u.domain([e.y,e.y+e.dy]),f.style("shape-rendering",null),f.selectAll(".depth").sort((function(t,e){return t.depth-e.depth})),r.selectAll("text").style("fill-opacity",0),l.selectAll("text").call(m).style("fill-opacity",0),s.selectAll("text").call(m).style("fill-opacity",1),l.selectAll("rect").call(x),s.selectAll("rect").call(x),l.remove().each("end",(function(){f.style("shape-rendering","crispEdges"),n=!1}))}return r.filter((function(t){return t.children})).classed("children",!0).on("click",l),r.selectAll(".child").data((function(t){return t.children||[t]})).enter().append("rect").attr("class","child").call(x),r.append("rect").attr("class","parent").call(x).append("title").text((function(t){return d(t.value)})),r.append("text").attr("dy",".75em").text((function(t){return t.name})).call(m),r}(l)},r.coordmap=function(e,n={}){let l=e.head.lets||e.head.vars||[],s=e.results.bindings,i=n.let_lat||l[0]||"lat",o=n.let_lng||l[1]||"lng",c=n.width||960,d=n.height||480,p=n.radius||5,u=n.color||"#FF3333",h=n.topojson||"world-50m.json",f=n.selector||null,g=t.geo.equirectangular().scale(153).translate([c/2,d/2]).precision(.1),y=t.geo.path().projection(g),m=t.geo.graticule(),x=r.select(f,"coordmap").append("svg").attr("width",c).attr("height",d);x.append("path").datum(m.outline).attr("fill","#a4bac7").attr("d",y),x.append("path").datum(m).attr("fill","none").attr("stroke","#333333").attr("stroke-width",".5px").attr("stroke-opacity",".5").attr("d",y),t.json(h,(t,e)=>{if(t)throw t;x.insert("path",".graticule").datum(a.feature(e,e.objects.land)).attr("fill","#d7c7ad").attr("stroke","#766951").attr("d",y),x.insert("path",".graticule").datum(a.mesh(e,e.objects.countries,(t,e)=>t!==e)).attr("class","boundary").attr("fill","none").attr("stroke","#a5967e").attr("stroke-width",".5px").attr("d",y),x.selectAll(".pin").data(s).enter().append("circle",".pin").attr("fill",u).attr("r",p).attr("stroke","#455346").attr("transform",(function(t){return"translate("+g([t[o].value,t[i].value])+")"}))})},r.namedmap=function(e,l={}){let s=e.head.lets||e.head.vars||[],i=e.results.bindings,o=l.label||s[0]||"label",c=l.value||s[1]||"value",d=l.width||1e3,p=l.height||1e3,u=l.color_max||"red",h=l.color_min||"white",f=l.color_scale||"log",g=l.topojson||"japan.topojson",y=l.mapname||"japan",m=l.keyname||"name_local",x=l.center_lat||34,v=l.center_lng||137,b=l.scale||1e4,k=l.selector||null,w=t.nest().key(t=>t[o].value).rollup(e=>t.sum(e,t=>parseInt(t[c].value))).map(i,t.map),A=t.extent(t.map(w).values());n(w);let M=r.select(k,"namedmap").append("svg").attr("width",d).attr("height",p);t.json(g,e=>{let r,n=a.object(e,e.objects[y]).geometries,l=t.geo.mercator().center([v,x]).translate([d/2,p/2]).scale(b),s=t.geo.path().projection(l);switch(f){case"log":r=t.scale.log();break;default:r=t.scale.linear()}let i=r.domain(A).range([h,u]);M.selectAll("path").data(n).enter().append("path").attr("d",s).attr("stroke","black").attr("stroke-width",.5).style("fill",(function(t,e){return i(w[t.properties[m]])})),M.selectAll(".place-label").data(n).enter().append("text").attr("font-size","8px").attr("class","place-label").attr("transform",(function(t){let e=t.properties.latitude,a=t.properties.longitude;return"translate("+l([a,e])+")"})).attr("dx","-1.5em").text(t=>t.properties[m])})},r.select=function(e,a){return(e?t.select(e).html(""):t.select("body")).append("div").attr("class","d3sparql "+a)},r.toggle=function(){let e=t.select("#button"),a=t.select("#sparql");"none"===a.style("display")?(a.style("display","inline"),e.attr("class","icon-chevron-up")):(a.style("display","none"),e.attr("class","icon-chevron-down"))},r.frameheight=function(e){t.select(self.frameElement).style("height",e+"px")},r}));
//# sourceMappingURL=d3sparql.umd.js.map
