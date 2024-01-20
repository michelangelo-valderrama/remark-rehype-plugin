import rehypeStringify from "rehype-stringify"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import { unified } from "unified"
import { visit } from "unist-util-visit"

const md = `
# Hi!

![img](https://neolorem.dev/favicon.svg)

[link](https://neolorem.dev)

[external link](https://www.ryanfiller.com/blog/remark-and-rehype-plugins#basic-plugin-structure)
`

const rehypeImageOptimization = () => (tree) => {
  return visit(tree, "image", (node) => {
    const data = node.data || (node.data = {})
    const props = data.hProperties || (data.hProperties = {})
    let src = node.url
    const alt = node.alt

    const newNode = {
      type: "html",
      value: `<figure>
        <img src="${src}" alt="${alt}" loading="lazy" />
        <figcaption>${alt}</figcaption>
      </figure>`,
    }

    props.loading = "lazy"

    console.log(node)
    console.log(Object.assign(node, newNode))
    // Object.assign(node, newNode)
  })
}

const rehypeExternalLink = () => (tree) => {
  return visit(tree, "link", (node) => {
    const data = node.data || (node.data = {})
    const props = data.hProperties || (data.hProperties = {})
    const url = node.url

    if (url.includes("https://neolorem.dev")) {
      return
    } else {
      props.target = "_blank"
      props.rel = "noopener"
      return
    }
  })
}

const rehypeLinkHeading = () => (tree) => {
  return visit(tree, "heading", (node) => {
    const data = node.data || (node.data = {})
    const props = data.hProperties || (data.hProperties = {})
    const slugId = /* slugify(toString(node)) */ "id"

    data.id = slugId
    props.id = slugId

    const originalChildren = [...node.children]

    node.children = [
      {
        type: "link",
        url: `#${slugId}`,
        children: originalChildren,
      },
    ]
  })
}

;(async () => {
  const html = await unified()
    .use(remarkParse)
    .use(rehypeImageOptimization)
    .use(rehypeExternalLink)
    .use(rehypeLinkHeading)
    .use(rehypeStringify)
    .use(remarkRehype)
    .process(md)
  console.log(html)
  // VFile {
  //   cwd: '/home/tokyo/Dev/projects/experiments/remark-plugin',
  //   data: {},
  //   history: [],
  //   messages: [],
  //   value: '<h1>Hi!</h1>\n' +
  //     '<p><img src="https://neolorem.dev/favicon.svg" alt="favicon"></p>'
  // }
})()
