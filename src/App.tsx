<Routes>
  <Route path="/admin*" element={<AdminDashboard />} />
  <Route path="*" element={<NotFound />} />
</Routes>