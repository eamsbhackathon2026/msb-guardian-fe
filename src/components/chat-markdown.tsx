import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/** Câu trả lời của trợ lý, render đúng thứ mô hình viết ra.
 *
 *  Mô hình nói markdown. Trước đây gateway gỡ markdown thành chữ thuần bằng một
 *  bộ luật viết tay, nên mỗi dạng chưa có luật lại lọt ra màn hình dưới dạng dấu
 *  lạ: `*nghiêng*`, `~~gạch~~`, cả URL trong `[nhãn](url)`. Danh sách ấy chỉ dài
 *  thêm theo thời gian, nên ở đây đọc markdown thật thay vì đuổi theo từng dạng.
 *
 *  Bong bóng chat rộng 330px, nên mọi khối đều phải gọn: chữ giữ cỡ của bong
 *  bóng, khoảng cách giữa các khối nhỏ hơn mặc định, và bảng — thứ gateway vốn
 *  đã tách ra thành bảng số liệu riêng — vẫn cuộn ngang được nếu lọt tới đây.
 */
export function ChatMarkdown({ text }: { text: string }) {
  return (
    <div className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="my-1.5">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          del: ({ children }) => <del className="text-muted line-through">{children}</del>,
          ul: ({ children }) => <ul className="my-1.5 list-disc pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="my-1.5 list-decimal pl-5">{children}</ol>,
          li: ({ children }) => <li className="my-0.5">{children}</li>,
          h1: ({ children }) => <h3 className="mb-1 mt-2.5 font-semibold">{children}</h3>,
          h2: ({ children }) => <h3 className="mb-1 mt-2.5 font-semibold">{children}</h3>,
          h3: ({ children }) => <h3 className="mb-1 mt-2.5 font-semibold">{children}</h3>,
          blockquote: ({ children }) => <blockquote className="my-1.5 border-l-2 border-line pl-2.5 text-muted">{children}</blockquote>,
          code: ({ children }) => <code className="rounded bg-app px-1 py-0.5 text-[13px]">{children}</code>,
          pre: ({ children }) => <pre className="my-1.5 overflow-x-auto rounded-lg bg-app p-2.5 text-[13px]">{children}</pre>,
          hr: () => <hr className="my-2 border-line" />,
          // Liên kết trong câu trả lời đến từ mô hình, không phải từ ngân hàng:
          // mở ở tab khác và cắt quan hệ với tab hiện tại.
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer noopener" className="text-primary underline">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-1.5 overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border-b border-line px-1.5 py-1 text-left font-semibold">{children}</th>,
          td: ({ children }) => <td className="border-b border-line px-1.5 py-1 align-top">{children}</td>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}
