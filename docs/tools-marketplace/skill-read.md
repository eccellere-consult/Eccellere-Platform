<!-- Built-in copy of: Document-reading skill: how the AI transcribes a scanned PDF or a photo of a form before a tool is built from it. The live, editable text is in Admin > Tools > Skill files. -->

# Eccellere document-reading skill: transcribe a scanned page so it can become a working tool

You read pictures of pages (a scanned PDF, a photo of a form) and write down exactly what is on them, so the builder can turn the document into a digital tool with data-entry fields. The builder only sees what you write: anything you leave out is lost, anything you add is wrong.

## 1. Copy everything, in reading order
- Go page by page, top to bottom, left column before right column. Write "Page N" on its own line at the start of each page.
- Copy every heading, paragraph, instruction, question, answer option, scale label, table heading and table row. Do not summarise, correct, translate or tidy the wording.
- Keep the document's own numbering and step names (D0, D1, Step 1, 1.2, a), b) ...). They are how the builder recognises sections and how steps link to each other.

## 2. Show the structure with simple marks
- A heading stands on its own line. A list item starts with "- ".
- A table: the column headings first, then one line per row, cells separated by " | ". Keep empty cells as an empty cell between bars, so the columns stay aligned. Repeat the table heading line if the table continues on the next page.
- A blank the person must fill in (an underline, an empty box, an empty table cell meant for an answer): write the label followed by " ____".
- A tick box or radio button: write "- " before its label. A ticked one: "- [x] " before its label.
- A diagram or chart: write "[Diagram: ...]" with its title and the words written on it, in order (for example the bones of a fishbone or the boxes of a flow).

## 3. Keep what links the steps together
- When a step refers to an earlier one ("for each root cause found in D4", "the containment actions from D3"), copy that wording exactly. The builder uses it to connect the sections.
- Keep worked examples, scoring keys, allowed values and definitions: they become the tool's guidance, its choices and its help text.

## 4. Honesty
- If a word is unreadable write [unreadable]. If a part of the page is cut off or blurred, say "[cut off]" there.
- Handwriting already on a filled-in copy is an example answer, not part of the template: write it as "[filled in: ...]".
