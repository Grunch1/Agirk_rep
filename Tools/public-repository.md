Git commits and pushes are checked by `.githooks/pre-commit` and
`.githooks/pre-push`. Node.js must be available. Missing Node, unreadable Git
objects, or an invalid guard file stop the operation.

The guard checks the entire staged snapshot and every outgoing commit after
the cleaned commit `ecbe01365430126ce188c76ce17cb3108d5804d4`. A file added and
later deleted is still caught. Branches and tags must descend from that cleaned
commit, and private Codex or other internal refs cannot be published.

The public admin allowlist contains `update_tags.php`, `get_section_json.php`,
`style.css`, `index.html`, `Admin_logo.png`, and `admin.jpg`. Other local admin
files remain private. Existing history for admin `index-panel.html` is preserved;
new commits cannot bring the file back.

XML/JSON/JS story collections, credentials, dependencies, media, archives, and
tool exports are blocked even when force-added. Empty `.gitkeep` files preserve
folders. The exceptions are project configuration, the shared Armenian title
index, PHP annotations, and one XML graph example of at most 16 KB at
`Source code/sample_data.txt`. The title index must contain filenames and titles
only. Known removed file hashes are blocked even if those files are renamed.

The hooks are enabled locally with:

```sh
git config core.hooksPath .githooks
```

Run that command after cloning, because Git does not install hooks from a clone
automatically. You can check staged content manually with:

```sh
node Tools/check-public-repository.js --staged
```

Keep the guard files enabled. `--no-verify`, removing the hooks, or disabling
`core.hooksPath` deliberately bypasses local protection. These hooks are guards
against accidental publishing and do not replace credential rotation.
