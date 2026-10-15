# MCP connectors for research: Corbis vs. Zotero

## What an MCP server is

MCP (Model Context Protocol) is an open standard for connecting AI assistants such as Claude to outside services. An **MCP server** is a small program that sits between the assistant and a service's API. It publishes a set of *tools*, each with a name, a plain-language description, and the inputs it expects (for example `search_papers(query)` or `get_annotations(item)`).

During a conversation, the assistant reads those tool descriptions, decides whether one would help, and calls it. The server turns that call into real API requests, handles authentication and formatting, and returns the result, which the assistant then uses in its answer.

MCP doesn't replace an API; it wraps one so the assistant can use it conversationally. That makes it strong for exploration and quick lookups. For data that ends up in a paper, a versioned script against the underlying API is still the more reproducible route.

There are two ways to run a server:

- **Remote servers** are hosted online and added in Claude as a *custom connector* via their URL. Claude calls them from Anthropic's cloud, so they also work in the browser.
- **Local servers** run on your own computer. They work in Claude Desktop, Cowork, or Claude Code, but not in the browser chat.

## Corbis vs. Zotero MCP

The core difference: **Corbis searches an external research database; Zotero MCP works on your own library.**

| | **Corbis** | **Zotero MCP** |
|---|---|---|
| **Searches** | An external database of finance, real estate and economics research | Your own Zotero library |
| **Content** | Paper metadata and abstracts, with some full text | Your saved items, the text of your PDFs (including drafts and working papers), and your highlights, notes and tags |
| **Main use** | Finding papers you don't have; checking claims; positioning a paper; verifying and formatting references | Searching what you've read; retrieving your annotations; drafting from your own notes; citing from your library |
| **Runs** | In the cloud, as a connector in your Claude account | Locally, alongside the Zotero desktop app |
| **Cost** | Uses Corbis account credits; some features need an enterprise plan | Free (community-built, open source) |
| **Writes back?** | No | Yes: can add notes, tags and items |
| **Blind spot** | Knows nothing about your notes or your own files | Only knows what you've already collected |

In short, Corbis answers *"What does the literature say, and what am I missing?"*, and Zotero MCP answers *"What have I read, and what did I note about it?"*

## Using them together

1. **Discover** new candidate papers with Corbis.
2. **Check** in Zotero which of them you already have and what you noted about them.
3. **Add** the new ones to your library.
4. **Draft** a literature section from your own notes and highlights, citing from your library's metadata so the references are real and correctly formatted.

## Zotero MCP: practical notes

- **Versions:** the most widely used is `54yyyu/zotero-mcp` (installed with pip or uv; needs Zotero's local API turned on). An alternative, `cookjohn/zotero-mcp`, runs as a Zotero plugin with the server built in, and can search annotations by highlight color, tag or keyword.
- **PDF access is text-only:** the assistant gets the extracted text, not the rendered pages. Figures are lost and tables often come through garbled; for those, upload the PDF or a screenshot to the chat directly. Scanned PDFs with no text layer can't be read without OCR.
- **Local files only:** PDFs held only in Zotero's cloud storage, or linked files on a disconnected drive, can't be read.
- **Indexing limits:** Zotero caps how much of each file it indexes, so the end of a very long PDF may not be searchable unless you raise the limit and re-index.
- **Privacy:** semantic search can use local embeddings or cloud ones (OpenAI or Gemini). With cloud embeddings, your library text is sent to that provider when the index is built. The local option is safer for unpublished drafts or refereeing material.
- **Back up first:** because the server can modify your library, turn on Zotero sync or back up your database before letting it make changes.
- **Maintenance:** it's an independent project, so expect occasional breakage after Zotero updates.

## Corbis: practical notes

- Connect it through the Corbis plugin's Connectors tab and sign in with your Corbis account; sign-in happens on Corbis's side.
- Searches use your account's credits. The standard literature search works on any plan; a few advanced features need an enterprise plan.
- Results are leads from metadata and abstracts. Confirming that a paper actually supports a claim still requires reading it.