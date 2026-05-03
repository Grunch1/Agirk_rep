class Utils {
    getXMLKeys(xmlDocs) {
        const keyMap = {};
        const keyElements = xmlDocs.querySelectorAll('key');

        keyElements.forEach(element => {
            const id = element.getAttribute('id');
            const attrName = element.getAttribute('attr.name')

            if (["is_lemma", "rank", "normal_form"].includes(attrName)) {
                keyMap[id] = attrName;
            }
        });

        return keyMap;
    }

    sanitizeValue(value) {
        if (!value) return "";
        const hasSpecialChars = /[\[\]{}<>]/.test(value);
        if (hasSpecialChars) return "";
        return value.trim();
    }

    getNodeList(xmlDoc, keyMap) {
        const nodes = [];
        const nodeElements = xmlDoc.querySelectorAll("node");

        nodeElements.forEach((nodeEl) => {
            let isLemma = false;
            let nodeData = {};
            const dataElements = nodeEl.querySelectorAll("data");

            dataElements.forEach((dataEle) => {
                const key = dataEle.getAttribute('key');
                const value = this.sanitizeValue(dataEle.textContent.trim());

                if (keyMap[key]) {
                    nodeData[keyMap[key]] = value;
                    if (keyMap[key] === 'is_lemma' && value === 'true') {
                        isLemma = true;
                    }
                }
            })

            if (nodeData.normal_form) {
                let nodeId = nodeEl.getAttribute("id");
                nodes.push({
                    id: nodeId,
                    label: nodeData.normal_form,
                    rank: Number(nodeData.rank) || 0,
                    level: Number(nodeData.rank) || 0,
                    isLemma: isLemma,
                })
            }
        })

        console.log(nodes, "nodes")
        return nodes.reverse();
    }

    getEdgesList(xmlDoc) {
        const edges = [];
        const edgeElements = xmlDoc.querySelectorAll("edge");

        edgeElements.forEach((edgeEle) => {
            const id = edgeEle.getAttribute("id");
            const source = edgeEle.getAttribute("source");
            const target = edgeEle.getAttribute("target");

            edges.push({
                id: id || Math.random().toString(),
                from: source,
                to: target,
            })
        })

        return edges;
    }
}

const utils = new Utils;
export default utils;