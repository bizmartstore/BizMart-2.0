{orders.map((order) => (
    <div key={order.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
      {/* Existing order display code */}
      <div className="flex items-center gap-2 mt-2">
        {/* ... existing content ... */}
      </div>
      {order.file_url && (
        <div className="flex items-center gap-2">
          <a
            href={order.file_url}
            download
            className="text-primary hover:text-primary/90 flex items-center gap-1">
            <Download className="h-4 w-4" />
          </a>
        </div>
      </div>
      {/* ... rest of order display ... */}
    </div>
  ))}