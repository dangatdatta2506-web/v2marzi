DROP POLICY IF EXISTS product_images_auth_select ON storage.objects;
CREATE POLICY product_images_staff_select
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);