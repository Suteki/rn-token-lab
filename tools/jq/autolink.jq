.dependencies
| to_entries
| map({
    name: .key,
    ios: (.value.platforms.ios != null),
    android: (.value.platforms.android != null)
  })
| sort_by(.name)
