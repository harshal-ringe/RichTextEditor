import React from 'react';
import { EditorState, ContentState, convertToRaw } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import '../node_modules/react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';

function renderItem(item) {
	let fullnameArray = String(item.value).toUpperCase().split(' ');
	let initials;
	if (fullnameArray.length == 1) {
		initials = fullnameArray[0] ? fullnameArray[0].charAt(0) : '?';
	} else {
		initials = fullnameArray[0].charAt(0) + fullnameArray[1].charAt(0);
	}
	return (
		<React.Fragment>
			<div id={"draft-mention-editor-" + item.id} style={{ display: 'flex', cursor: 'pointer' }}>
				{
					(item.avatar != undefined && item.avatar != '') ?
						<img className="draft-mention-avatar" src={item.avatar} />
						:
						<div className="display-center draft-mention-avatar">
							{initials}
						</div>
				}
				{
					(item.title != undefined && item.title != '') ?
						<div className="mention-name" title={item.value}>
							{item.value}
							<div title={item.title} className="mention-title">
								{item.title}
							</div>
						</div>
						:
						<div className="mention-name" title={item.value}>
							{item.value}
						</div>
				}
			</div>
		</React.Fragment>
	)
}
export default class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			editorState: EditorState.createEmpty(),
			isToolbarHidden: false,
			mentionData: []
		};
		this.overflowX_value = "unset";
	}

	showToolbar() {
		this.setState({ isToolbarHidden: false })
	}

	hideToolbar() {
		this.setState({ isToolbarHidden: true })
	}

	set(content) {
		const { contentBlocks, entityMap } = htmlToDraft(content);
		Object.values(convertToRaw(ContentState.createFromBlockArray(contentBlocks, entityMap)).entityMap).forEach(entity => {
			if (entity.type === 'MENTION') {
				entity.data.url = '#' + entity.data.url.split("#").pop()
			}
		});
		this.setState({ editorState: EditorState.createWithContent(ContentState.createFromBlockArray(contentBlocks, entityMap)) }, () => {
			this.onEditorStateChange(this.state.editorState);
		});
	}

	getText() {
		let text = draftToHtml(convertToRaw(this.state.editorState.getCurrentContent())).replace(/(<([^>]+)>)/ig, "");
		if (typeof text == "string") {
			return text.trim();
		}
		return "";
	}

	get(options) {
		let html = '';
		if (options && options.callback) {
			setTimeout(() => {
				html = draftToHtml(convertToRaw(this.state.editorState.getCurrentContent()));
				options.callback(html);
			}, 100)
		} else {
			return draftToHtml(convertToRaw(this.state.editorState.getCurrentContent()));
		}
	}

	setMentionData(data) {
		this.setState({ mentionData: data });
	}

	getMentionContents = () => {
		const entityMap = convertToRaw(this.state.editorState.getCurrentContent()).entityMap;
		const mentions = [];

		Object.values(entityMap).forEach(entity => {
			if (entity.type === 'MENTION') {
				mentions.push({ "id": entity.data.url.replace('#', ''), "value": entity.data.value });
			}
		});
		return mentions;
	}

	renderMentionData = () => {
		let mentions = []
		if (this.state.mentionData.length) {
			this.state.mentionData.map((item, i) => {
				mentions.push({
					text: renderItem(item),
					value: item.value,
					url: '#' + item.id
				})
			});
		}
		return mentions;
	}

	onEditorStateChange = (editorState) => {
		this.setState({ editorState })
	}

	componentDidMount() {
		window.richTextEditor = this;
	}

	render() {
		return (
			<React.Fragment>
				{/* <div style={{position:"fixed", top: "9px", right: "8px", height: "20px", zIndex: 1000}}>
						// {/* <button onClick={()=>{ setTimeout(()=>{alert(this.get());}, 100)}}>GET</button> */}
				{/* <button onClick={()=>{ alert(this.get());}}>GET</button> */}
				{/* </div> */}
				<div className="draftjs-editor-container" >
					<Editor
						toolbarHidden={this.state.isToolbarHidden}
						ref={(Editor) => { this.editor = Editor }}
						editorState={this.state.editorState}
						onEditorStateChange={this.onEditorStateChange}
						toolbar={{
							options: ['blockType', 'inline', 'colorPicker', 'link', 'list', 'textAlign'],
							inline: {
								options: ['bold', 'italic', 'underline', 'strikethrough'],
							},
							list: {
								options: ['unordered', 'ordered']
							},
							link: {
								options: ['link'],
							},
							blockType: {
								inDropdown: true,
								options: ['Normal', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'],
								className: undefined,
								component: undefined,
								dropdownClassName: undefined,
							},
							image: {
								alignmentEnabled: false,
								previewImage: true,
								// uploadCallback: this.uploadImageCallBack,
								defaultSize: {
									height: 'auto',
									width: '100',
								},
							},
							link: {
								// linkCallback: this.linkCallback//params => ({ ...params })
							}
						}}
						mention={{
							separator: ' ',
							trigger: '@',
							suggestions: (this.state.mentionData.length) ? this.renderMentionData() : [{}]
						}}
					/>
				</div>
			</React.Fragment>
		)
	}
}
