module.exports =

  parse: (cp) =>
    if not Array.isArray(cp)
      cp = [cp]
    # Convert citeproc to internal format
    cp_references = []
    for ref in cp
      cp_object = {}
      cp_object.citationKey = ref.id
      cp_object.entryType = ref.type
      tags = {}
      # Title
      tags.title = ref.title
      # Authors
      if ref.author?
        authors = []
        for author in ref.author
          na = {}
          if author.literal?
            na.familyName = author.literal
            na.personalName = ''
          else
            na.familyName = author.family
            na.personalName = author.given
          authors = authors.concat na
        tags.authors = authors
      # Editors
      if ref.editor?
        editors = []
        for editor in ref.editor
          na = {}
          na.familyName = editor.family
          na.personalName = editor.given
          editors = editors.concat na
        tags.editors = editors
      # Entry type
      tags.type = ref.type
      # Container title
      tags.in = ''
      if ref['container-title']?
        tags.in = ref['container-title']
      if ref.volume?
        tags.in += " vol. " + ref.volume
      # URL ?
      if ref.DOI?
        tags.url = "http://dx.doi.org/" + ref.DOI
      else if ref.URL
        tags.url = ref.URL
      # Assign tags
      cp_object.entryTags = tags
      cp_references = cp_references.concat cp_object
    return cp_references
