all: html pdf docx rtf

pdf: resume.pdf
resume.pdf: resume.md
	pandoc --standalone --template style_chmduquesne.tex \
	--from markdown --to context \
	-V papersize=A4 \
	-o resume.tex resume.md; \
	context resume.tex

html: resume.html
resume.html: style_chmduquesne.css resume.md
	pandoc --standalone -H style_chmduquesne.css \
				--from markdown --to html \
				-o resume.html resume.md

docx: resume.docx
resume.docx: resume.md
	pandoc -s -f markdown+smart resume.md -o resume.docx

rtf: resume.rtf
resume.rtf: resume.md
	pandoc -s -f markdown+smart resume.md -o resume.rtf

deploy: html
	mkdir -p ../static/resume/
	cp resume.html ../static/resume/index.html
	cp resume.docx ../static/resume/resume.docx
	cp resume.pdf ../static/resume/resume.pdf

clean:
	rm resume.html
	rm resume.tex
	rm resume.tuc
	rm resume.log
	rm resume.pdf
	rm resume.docx
	rm resume.rtf
