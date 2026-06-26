# Chrome Web Store publishing checklist

Use these values in the Chrome Web Store Developer Dashboard, then click **Save draft**.

## Store listing

Category: Productivity

Language: Chinese (Simplified)

Screenshot: upload `store-assets/octoman-read-later-screenshot-1280x800.png`

## Privacy practices

Single purpose:

```text
Octoman Read Later lets users save the current page title and URL to a local read-later list, then manage those saved links from the popup or Chrome side panel.
```

Remote code:

```text
This extension does not load or execute remotely hosted code. All JavaScript, HTML, and CSS are packaged with the extension. The extension only opens user-saved URLs in normal browser tabs when the user chooses to open an item.
```

sidePanel permission:

```text
The sidePanel permission is required to show the user's read-later list in Chrome's side panel so the user can view, edit, delete, and restore saved links while continuing to browse the current page.
```

storage permission:

```text
The storage permission is required to save the user's read-later list, notes, timestamps, and trash entries locally in the browser. Data is not sent to any external server.
```

tabs permission:

```text
The tabs permission is required only after the user clicks the add button, so the extension can read the active tab's title and URL and save that page to the local read-later list.
```

Data use confirmation:

```text
Confirm that the extension's data use complies with the Chrome Web Store Developer Program Policies. The extension stores saved page titles, URLs, notes, and trash state locally and does not sell, transfer, or use this data for advertising.
```

## Chinese copy

Single purpose:

```text
Octoman Read Later 用于让用户将当前网页的标题和 URL 保存到本地稍后阅读列表，并通过弹窗或 Chrome 侧边栏管理这些已保存链接。
```

Remote code:

```text
本扩展不会加载或执行远程托管代码。所有 JavaScript、HTML 和 CSS 都随扩展一起打包。扩展只会在用户主动打开已保存条目时，在普通浏览器标签页中打开对应 URL。
```

sidePanel permission:

```text
需要 sidePanel 权限，以便在 Chrome 侧边栏中显示用户的稍后阅读列表，让用户在继续浏览当前页面时查看、编辑、删除和恢复已保存链接。
```

storage permission:

```text
需要 storage 权限，以便在浏览器本地保存用户的稍后阅读列表、备注、时间戳和回收站条目。数据不会发送到任何外部服务器。
```

tabs permission:

```text
需要 tabs 权限，仅在用户点击添加按钮后读取当前活动标签页的标题和 URL，并将该页面保存到本地稍后阅读列表。
```

Data use confirmation:

```text
确认扩展的数据使用方式符合 Chrome 网上应用店开发者计划政策。扩展只在本地保存页面标题、URL、备注和回收站状态，不出售、不转移，也不将这些数据用于广告。
```

