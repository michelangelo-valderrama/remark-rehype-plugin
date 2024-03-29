import { unified } from "unified"
import { visit } from "unist-util-visit"
import fs from "node:fs/promises"
import rehypeParse from "rehype-parse"
import rehypeStringify from "rehype-stringify"
import remarkFrontmatter from "remark-frontmatter"
import remarkGfm from "remark-gfm"
import remarkParse from "remark-parse"
import remarkStringify from "remark-stringify"

const ORIGINAL_FILES_PATH = "./files/original"
const MODIFIED_FILES_PATH = "./files/modified"

const t = () => (tree) => {
  return visit(tree, "element", (node, _, parent) => {
    if (node.tagName !== "figure") return
    const image = node.children.find((v) => v.tagName === "img")
    let src = image.properties.src
    src = src[0] === "/" ? src : `/${src}`
    const alt = image.properties.alt
    parent.children.splice(parent.children.indexOf(node), 1, {
      type: "text",
      value: `![${alt}](${src})`,
    })
  })
}

const plugin = () => async (tree) => {
  const promises = []

  const v = (node, _, parent) => {
    if (node.value.includes("<figure>\n")) {
      const promise = unified()
        .use(rehypeParse)
        .use(t)
        .use(rehypeStringify)
        .process(node.value)
        .then((vFile) => {
          const text = vFile.toString()
          const value = text.slice(text.indexOf("!"), text.lastIndexOf(")") + 1)
          const n = {
            type: "html",
            value: `\n${value}\n`,
            position: node.position,
          }
          parent.children.splice(parent.children.indexOf(node), 1, n)
        })
      promises.push(promise)
    }
  }

  visit(tree, "html", v)
  await Promise.all(promises)
  return
}

const replaceFigures = async (content) => {
  return unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkGfm)
    .use(plugin)
    .use(remarkStringify, {
      bullet: "-",
      bulletOther: "+",
      rule: "_",
    })
    .process(content)
}

;(async () => {
  const files = await fs.readdir(ORIGINAL_FILES_PATH, "utf-8")
  const promises = []
  files.forEach(async (f) => {
    const promise = fs
      .readFile(`${ORIGINAL_FILES_PATH}/${f}`, "utf-8")
      .then((content) => {
        replaceFigures(content).then((data) => {
          fs.writeFile(`${MODIFIED_FILES_PATH}/${f}`, data.toString())
        })
      })
    promises.push(promise)
  })
  Promise.all(promises)
})()

// para pruebas
// ;(async () => {
//   const file = await fs.readFile(`${MODIFIED_FILES_PATH}/test.md`, "utf-8")
//   const resp = await replaceFigures(file)
//   console.log("\n\n-----------Response-----------\n\n" + resp.toString())
// })()
