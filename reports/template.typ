#let table_underline(s) = [
  #set text(baseline: 5pt)
  #s
  #v(-0.5em)
  #line(length: 100%, stroke: 1pt)
]
#import "@preview/cuti:0.4.0": show-cn-fakebold
#let justify(s) = {
  set text(weight: "bold")
  if type(s) == content and s.has("text") { s = s.text }
  assert(type(s) == type("string"))
  s.clusters().join(h(1fr))
}

#let cover(
  title: str,
  course: str,
  class: str,
  student-id: str,
  student-name: str,
) = {
  set page(paper: "a4", margin: 2cm)
  set text(14pt, font: "SimSun")
  grid(
    columns: (auto, 1fr),
    align: (left, right),
    image("cau-logo.png", width: 100pt),
    table(
      columns: 80pt,
      rows: (25pt, 25pt),
      align: center + horizon,
      [成绩],
      [],
    ),
  )
  v(8pt)

  align(center)[
    #text(size: 36pt)[
      中国农业大学\
      课程作业
    ]
  ]

  v(100pt)
  align(center)[
    #box(width: 80%)[
      #set text(16pt)
      #table(
        columns: (120pt, 2pt, 1fr),
        rows: 40pt,
        align: center + bottom,
        stroke: none,
        justify[作业题目], [:], table_underline[#title],
        justify[课程名称], [:], table_underline[#course],
        justify[班级], [:], table_underline[#class],
        justify[学号], [:], table_underline[#student-id],
        justify[姓名], [:], table_underline[#student-name],
      )
    ]
  ]
}


#let template(
  title: content,
  course: str,
  body,
) = {
  cover(
    title: title,
    course: course,
    class: "计算231",
    student-id: "2023308250117",
    student-name: "龚浩然",
  )
  set text(font: ("Times New Roman", "SimSun"), size: 12pt)
  set par(
    first-line-indent: (
      amount: 2em,
      all: true,
    ),
  )
  show heading.where(level: 1): it => [
    #block(width: 100%)[
      #set align(center)
      #v(6pt)
      #text(weight: "bold", 16pt)[#it.body]
      #v(6pt)
    ]
  ]
  show ":": "："
  show ",": "，"
  [#body]
}
