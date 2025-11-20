import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, ImageRun } from "docx";
import { InvoiceData, CompanyProfile } from "../types";

const getBase64Buffer = (base64: string): Uint8Array => {
  try {
    const cleanBase64 = base64.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
    const binaryString = window.atob(cleanBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error("Error decoding base64", e);
    return new Uint8Array(0);
  }
};

export const generateDocx = async (data: InvoiceData, profile: CompanyProfile) => {
  const { items } = data;
  const currency = profile.currencySymbol || "₦";
  const children = [];

  // 1. Header Section
  if (profile.logoBase64) {
    const logoBuffer = getBase64Buffer(profile.logoBase64);
    if (logoBuffer.length > 0) {
        children.push(
            new Paragraph({
                children: [
                    new ImageRun({
                        data: logoBuffer,
                        transformation: { width: 100, height: 50 },
                    }),
                ],
                spacing: { after: 200 },
            })
        );
    }
  }

  children.push(
    new Paragraph({
      children: [new TextRun({ text: profile.companyName, bold: true, size: 32 })],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: profile.companyAddress, size: 20 })],
    }),
    new Paragraph({
      children: [new TextRun({ text: `${profile.email} | ${profile.phone}`, size: 20 })],
    }),
    new Paragraph({
       children: [new TextRun({ text: profile.website || "", size: 20 })],
       spacing: { after: 400 },
    })
  );

  // 2. Invoice Meta Table (2 Columns)
  const metaTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }},
      rows: [
          new TableRow({
              children: [
                  new TableCell({
                      children: [
                          new Paragraph({ children: [new TextRun({ text: "BILL TO:", bold: true, size: 24 })] }),
                          new Paragraph({ children: [new TextRun({ text: data.clientName, size: 24 })] }),
                          new Paragraph({ children: [new TextRun({ text: data.clientAddress || "", size: 20 })] }),
                      ],
                      width: { size: 60, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                      children: [
                          new Paragraph({ children: [new TextRun({ text: "INVOICE", bold: true, size: 48, color: "CCCCCC" })], alignment: AlignmentType.RIGHT }),
                          new Paragraph({ children: [new TextRun({ text: `No: ${data.invoiceNumber || '---'}`, bold: true })], alignment: AlignmentType.RIGHT }),
                          new Paragraph({ children: [new TextRun({ text: `Date: ${data.invoiceDate}`, bold: true })], alignment: AlignmentType.RIGHT }),
                          new Paragraph({ children: [new TextRun({ text: `Status: ${data.status || 'PENDING'}`, bold: true, color: data.status === 'PAID' ? "008000" : "FF0000" })], alignment: AlignmentType.RIGHT }),
                      ],
                      width: { size: 40, type: WidthType.PERCENTAGE },
                  }),
              ],
          }),
      ],
  });
  children.push(metaTable, new Paragraph({ spacing: { after: 400 } }));

  // 3. Items Table
  const tableRows = [
      new TableRow({
          children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Date", bold: true })] })], shading: { fill: "E5E7EB" } }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Description", bold: true })] })], shading: { fill: "E5E7EB" } }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Amount", bold: true })], alignment: AlignmentType.RIGHT })], shading: { fill: "E5E7EB" } }),
          ],
      }),
      ...items.map(item => new TableRow({
          children: [
              new TableCell({ children: [new Paragraph(item.date)] }),
              new TableCell({ children: [new Paragraph(item.description), ...(item.timeIn || item.timeOut ? [new Paragraph({ children: [new TextRun({ text: `In: ${item.timeIn} Out: ${item.timeOut}`, italics: true, size: 16, color: "6B7280" })] })] : [])] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${currency}${item.amount.toFixed(2)}` })], alignment: AlignmentType.RIGHT })] }),
          ],
      }))
  ];

  children.push(
      new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
      }),
      new Paragraph({ spacing: { after: 200 } })
  );

  // 4. Totals
  children.push(
      new Paragraph({
          children: [new TextRun({ text: `TOTAL: ${currency}${data.totalAmount.toFixed(2)}`, bold: true, size: 36 })],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 400 },
      })
  );

  // 5. Bank & Signature
  const footerTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }},
      rows: [
          new TableRow({
              children: [
                  new TableCell({
                      children: [
                          new Paragraph({ children: [new TextRun({ text: "Payment Details:", bold: true })] }),
                          new Paragraph({ children: [new TextRun({ text: profile.bankDetails || "" })] }),
                          new Paragraph({ children: [new TextRun({ text: "Terms:", bold: true })], spacing: { before: 200 } }),
                          new Paragraph({ children: [new TextRun({ text: profile.termsAndConditions || "" })] }),
                      ],
                      width: { size: 60, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                      children: [
                        ...(profile.signatureBase64 ? [
                            new Paragraph({
                                children: [
                                    new ImageRun({
                                        data: getBase64Buffer(profile.signatureBase64),
                                        transformation: { width: 100, height: 40 },
                                    })
                                ],
                                alignment: AlignmentType.RIGHT
                            })
                        ] : []),
                        new Paragraph({ children: [new TextRun({ text: "Authorized Signature", bold: true, size: 16 })], alignment: AlignmentType.RIGHT }),
                      ],
                      width: { size: 40, type: WidthType.PERCENTAGE },
                  }),
              ]
          })
      ]
  });
  children.push(footerTable);

  // 6. Generate
  const doc = new Document({
      sections: [{
          properties: {},
          children: children,
      }],
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Invoice_${data.invoiceNumber || "Draft"}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};